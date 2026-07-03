import { RoutineContext } from '@/context'
import express, { RouterOptions, Request, Response } from 'express'
import { FormattedDateTime, formatDateTime, formatInterval } from '@/lib/utils'
import { createBoundFetchWithRetry, RetryConfig, RetryStats } from '@/lib/fetch-with-retry'

export interface RoutineRouterOptions extends RouterOptions {
  onStart?: () => Promise<void> | void
  onStop?: () => Promise<void> | void
  enableDefaultRoutes?: boolean
  retryConfig?: RetryConfig // Allow disabling default routes if needed
}

export interface RoutineRouterStatus {
  running: boolean
  interval: {
    ms: number
    formatted: string
  }
  name: string
  lastExecution?: FormattedDateTime
  nextExecution?: FormattedDateTime
  stopReason?: RoutineStopReason
  startedAt?: FormattedDateTime
  executionCount: number
  averageExecutionTime?: number
  lastExecutionTime?: number
}

interface RoutineStopReason {
  error: Error | null
  message: string
}

export interface RoutineStats {
  apiCallCount: number
  errorCount: number
  retryStats: RetryStats
}

export abstract class RoutineRouter {
  private router: express.Router
  private context: RoutineContext
  public name: string
  protected intervalId: NodeJS.Timeout | null = null
  protected abstract interval: number
  protected onStart?: () => Promise<void> | void
  protected onStop?: () => Promise<void> | void
  private isRunning: boolean = false
  private lastExecution?: Date
  private startedAt?: Date
  private stopReason?: RoutineStopReason
  public stats: RoutineStats

  protected fetchWithRetry: (url: URL | string, options?: RequestInit) => Promise<globalThis.Response>

  private executionCount: number = 0
  private executionTimes: number[] = []
  private readonly maxExecutionTimeHistory = 10 // Keep last 10 execution times for average

  constructor(name: string, options: RoutineRouterOptions = {}) {
    this.router = express.Router(options)
    this.context = new RoutineContext(name)
    this.name = name
    this.onStart = options.onStart
    this.onStop = options.onStop

    // Setup default routes unless disabled
    if (options.enableDefaultRoutes !== false) {
      this.setupDefaultRoutes()
    }

    // Allow subclasses to define their custom routes
    this.defineRoutes()
    this.fetchWithRetry = createBoundFetchWithRetry(
      {
        logger: this.ctx.logger,
        stats: this.stats,
      },
      options.retryConfig
    )
  }

  /**
   * Format the router stack to show all registered routes
   */
  private formatRouterStack() {
    return this.router.stack.map((layer: any, index: number) => {
      const route = layer.route
      if (route) {
        // This is a route (has specific path and methods)
        const methods = Object.keys(route.methods)
          .filter((method) => route.methods[method])
          .map((method) => method.toUpperCase())

        return {
          index,
          type: 'route',
          path: route.path,
          methods: methods,
          methodsString: methods.join(', '),
          keys: layer.keys || [],
          handlerCount: route.stack?.length || 0,
        }
      } else {
        return {
          index,
          type: 'middleware',
          keys: layer.keys || [],
          name: layer.handle?.name || 'anonymous',
        }
      }
    })
  }

  /**
   * Get a summary of all routes (useful for debugging)
   */
  public getRouteSummary() {
    const formatted = this.formatRouterStack()
    const routes = formatted.filter((item) => item.type === 'route')
    const middleware = formatted.filter((item) => item.type === 'middleware')

    return {
      total: formatted.length,
      routes: routes.length,
      middleware: middleware.length,
      routeList: routes.map((r) => `${r.methodsString} ${r.path}`),
      details: formatted,
    }
  }

  /**
   * Setup the default control routes for the routine
   */
  private setupDefaultRoutes() {
    this.addRoute('get', '/', (_req: Request, res: Response) => {
      const routeSummary = this.getRouteSummary()
      res.json({
        name: this.name,
        routes: routeSummary.routeList,
      })
    })
    // Start the routine
    this.addRoute('post', '/start', async (_req: Request, res: Response) => {
      try {
        if (this.isRunning) {
          this.context.logger.logAlreadyRunning()
          res.status(400).json({
            error: 'Routine is already running',
            name: this.name,
            status: this.getStatus(),
          })
          return
        }

        const result = this.shouldNotStart()
        if (result.shouldNotStart) {
          res.status(400).json({
            error: 'Routine will not start',
            reason: result.reason,
            name: this.name,
          })
          return
        }

        await this.start()
        res.json({
          message: 'Routine started successfully',
          name: this.name,
          interval: this.interval,
          status: this.getStatus(),
        })
      } catch (error) {
        this.context.logger.error('Failed to start routine via API', { error })
        res.status(500).json({
          error: 'Failed to start routine',
          details: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })

    // Stop the routine
    this.addRoute('post', '/stop', async (_req: Request, res: Response) => {
      try {
        if (!this.isRunning) {
          res.status(400).json({
            error: 'Routine is not running',
            name: this.name,
            status: this.getStatus(),
          })
          return
        }

        await this.stop()
        res.json({
          message: 'Routine stopped successfully',
          name: this.name,
          status: this.getStatus(),
        })
      } catch (error) {
        this.context.logger.error('Failed to stop routine via API', { error })
        res.status(500).json({
          error: 'Failed to stop routine',
          details: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })

    // Execute the routine once
    this.addRoute('post', '/execute', async (_req: Request, res: Response) => {
      try {
        const executionTimer = this.context.logger.perf.start({
          id: `${this.name}:api-execute`,
          onStart: () => {
            this.context.logger.info('Manual execution requested via API')
          },
          printf: (duration: number) => {
            return `Manual execution completed in ${duration}ms`
          },
        })

        await this.executeRoutine()
        executionTimer.end()

        res.json({
          message: 'Routine executed successfully',
          name: this.name,
          timestamp: new Date().toISOString(),
          executionTime: this.executionTimes[this.executionTimes.length - 1],
          status: this.getStatus(),
        })
      } catch (error) {
        this.context.logger.error('Failed to execute routine via API', {
          error,
        })
        res.status(500).json({
          error: 'Failed to execute routine',
          details: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    })

    // Get routine status
    this.addRoute('get', '/status', (_req: Request, res: Response) => {
      res.json(this.getStatus())
    })

    // Get detailed logs (last N entries)
    this.addRoute('get', '/logs', (req: Request, res: Response) => {
      const limit = parseInt(req.query.limit as string) || 50
      res.json({
        name: this.name,
        logs: this.context.logger.getRecentLogs(limit),
        status: this.getStatus(),
      })
    })

    // Reset execution statistics
    this.addRoute('post', '/reset-stats', (_req: Request, res: Response) => {
      this.executionCount = 0
      this.executionTimes = []
      this.context.logger.info('Execution statistics reset')
      this.stats = this.defaultStats()

      res.json({
        message: 'Statistics reset successfully',
        name: this.name,
        status: this.getStatus(),
      })
    })
    this.addRoute('get', '/stats', (_req: Request, res: Response) => {
      res.json(this.stats)
    })
  }

  /**
   * Override this method to define custom routes for your routine
   * This is called during construction after default routes are set up
   */
  protected defineRoutes(): void {
    // Default implementation does nothing
    // Subclasses can override this to add custom routes
  }
  protected abstract defaultStats(): RoutineStats

  protected shouldNotStart(): { shouldNotStart: boolean; reason: string } {
    return { shouldNotStart: false, reason: '' }
  }

  /**
   * Helper method for subclasses to add routes more easily
   */
  protected addRoute(
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    path: string,
    handler: (req: Request, res: Response) => void | Promise<void>
  ) {
    this.router[method](path, async (req: Request, res: Response) => {
      const routeTimer = this.context.logger.perf.start({
        id: `${this.name}:route-${method}-${path}`,
        onStart: () => {
          this.context.logger.info(`Handling ${method.toUpperCase()} ${path}`)
        },
        printf: (duration: number) => {
          return `Route ${method.toUpperCase()} ${path} handled in ${duration}ms`
        },
      })

      try {
        await handler(req, res)
      } catch (error) {
        this.context.logger.error(
          `Route handler failed for ${method.toUpperCase()} ${path}`,
          { error }
        )
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Route handler failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            path: `${method.toUpperCase()} ${path}`,
            timestamp: new Date().toISOString(),
          })
        }
      } finally {
        routeTimer.end()
      }
    })
  }

  public async start() {
    if (this.isRunning) {
      this.context.logger.logAlreadyRunning()
      throw new Error('Routine is already running')
    }

    this.context.logger.logStart(this.interval)
    this.startedAt = new Date()
    this.stopReason = undefined
    this.isRunning = true

    if (this.onStart) {

      try {
        await this.onStart()
      } catch (error) {
        this.context.logger.error('onStart callback failed', { error })
        this.isRunning = false
        throw error
      } finally {
      }
    }

    // Execute once immediately
    await this.executeRoutine()

    // Set up interval
    this.intervalId = setInterval(async () => {
      await this.executeRoutine()
    }, this.interval)

    this.context.logger.info(
      `Routine started with ${formatInterval(this.interval)} interval`
    )
  }

  public async stop(error: Error | string | null = null) {
    if (!this.isRunning) {
      throw new Error('Routine is not running')
    }

    this.context.logger.logStop()

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    if (this.onStop) {
      const stopTimer = this.context.logger.perf.start({
        id: `${this.name}:onStop`,
        onStart: () => {
          this.context.logger.info('Executing onStop callback...')
        },
        printf: (duration: number) => {
          return `onStop callback completed in ${duration}ms`
        },
      })

      try {
        await this.onStop()
      } catch (stopError) {
        this.context.logger.error('onStop callback failed', {
          error: stopError,
        })
      } finally {
        stopTimer.end()
      }
    }

    this.isRunning = false

    if (error) {
      this.stopReason = {
        error: error instanceof Error ? error : null,
        message: error instanceof Error ? error.message : error,
      }
      this.context.logger.error('Routine stopped due to error', { error })
    }
  }

  private async executeRoutine(): Promise<void> {
    this.lastExecution = new Date()
    this.executionCount++

    const timer = this.context.logger.perf.start({
      id: `${this.name}:executeRoutine`,
      onStart: () => {
        this.context.logger.info(
          `Executing routine ${this.name}... (execution #${this.executionCount})`
        )
      },
      printf: (duration: number) => {
        return `Executed routine in ${duration}ms`
      },
    })

    try {
      await this.execute()
    } catch (error) {
      this.context.logger.logExecutionError(error)
      await this.stop(error as Error)
      throw error // Re-throw to be handled by caller if needed
    } finally {
      const duration = timer.end()

      // Track execution time for statistics
      this.executionTimes.push(duration)
      if (this.executionTimes.length > this.maxExecutionTimeHistory) {
        this.executionTimes.shift() // Remove oldest entry
      }
    }
  }

  public getStatus(): RoutineRouterStatus {
    const next = formatDateTime(
      (this.lastExecution?.getTime() ||
        this.startedAt?.getTime() ||
        Date.now()) + this.interval
    )

    const averageExecutionTime =
      this.executionTimes.length > 0
        ? this.executionTimes.reduce((sum, time) => sum + time, 0) /
          this.executionTimes.length
        : undefined

    return {
      running: this.isRunning,
      interval: {
        ms: this.interval,
        formatted: formatInterval(this.interval),
      },
      name: this.name,
      lastExecution: this.lastExecution
        ? formatDateTime(this.lastExecution)
        : undefined,
      nextExecution: this.isRunning ? next : undefined,
      startedAt: this.startedAt ? formatDateTime(this.startedAt) : undefined,
      stopReason: this.stopReason,
      executionCount: this.executionCount,
      averageExecutionTime: averageExecutionTime
        ? Math.round(averageExecutionTime * 100) / 100
        : undefined,
      lastExecutionTime:
        this.executionTimes.length > 0
          ? this.executionTimes[this.executionTimes.length - 1]
          : undefined,
    }
  }

  /**
   * The main execution logic for the routine
   */
  abstract execute(): Promise<void>

  /**
   * Get the Express router instance
   */
  public get routes(): express.Router {
    return this.router
  }

  public getRoutes(): express.Router {
    return this.router
  }

  /**
   * Get the routine context
   */
  public get ctx(): RoutineContext {
    return this.context
  }

  /**
   * Check if the routine is currently running
   */
  public get running(): boolean {
    return this.isRunning
  }
}
