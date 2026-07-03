import winston from 'winston'
import { config, LogLevel } from '@/config'
import { createConsoleFormat } from './format'
import { broadcastTransport } from './broadcastTransport'
import { logBroadcaster, LogEntry } from './logBroadcaster'

export type LogMeta = Record<string, unknown>

interface PerfOptions {
  level?: LogLevel
  id?: string
  onStart?: () => void
  printf?: (duration: number) => string
}

interface PerfInstance {
  getCurrentDuration(): number
  logNow(decimals?: number): number
  end(decimals?: number): number
}

class Perf {
  private logger: winston.Logger
  private timerCounter = 0

  constructor(logger: winston.Logger) {
    this.logger = logger
  }

  start(options: PerfOptions = {}): PerfInstance {
    const startTime = performance.now()
    const timerId = options.id || `timer_${++this.timerCounter}`

    const getCurrentDuration = () => {
      return performance.now() - startTime
    }

    const logNow = (decimals: number = 2) => {
      const currentDuration = performance.now() - startTime
      const message = options.printf
        ? options.printf(Number(currentDuration.toFixed(decimals)))
        : `Timer "${timerId}" current duration: ${currentDuration.toFixed(
            decimals
          )}ms`

      this.logger.log('timer', message)
      return currentDuration
    }

    const end = (decimals: number = 2) => {
      const duration = performance.now() - startTime
      const message = options.printf
        ? options.printf(Number(duration.toFixed(decimals)))
        : `Timer "${timerId}" completed in ${duration.toFixed(decimals)}ms`

      this.logger.log('timer', message)
      return duration
    }

    if (options.onStart) {
      options.onStart()
    }

    return { getCurrentDuration, logNow, end }
  }
}

export class BaseLogger {
  protected logger: winston.Logger
  public perf: Perf
  private context?: string

  constructor(context?: string) {
    this.context = context
    this.logger = winston.createLogger({
      level: config.logLevel,
      levels: {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
        timer: 4,
        verbose: 5,
      },
      format: createConsoleFormat(),
      defaultMeta: context ? { context } : {},
      transports: [new winston.transports.Console(), broadcastTransport],
    })
    this.perf = new Perf(this.logger)
  }

  info(message: string, meta?: LogMeta): void {
    this.logger.info(message, meta)
  }

  warn(message: string, meta?: LogMeta): void {
    this.logger.warn(message, meta)
  }

  error(message: string, meta?: LogMeta): void {
    this.logger.error(message, meta)
  }

  debug(message: string, meta?: LogMeta): void {
    this.logger.debug(message, meta)
  }

  timer(message: string, meta?: LogMeta): void {
    this.logger.log('timer', message, meta)
  }

  getWinstonInstance(): winston.Logger {
    return this.logger
  }

  getRecentLogs(limit = 50): LogEntry[] {
    return logBroadcaster.getRecent(limit, this.context)
  }
}
