import {
  RoutineRouter,
  RoutineRouterOptions,
  RoutineStats,
} from './routineRouter'
import { PostHydrant } from '@sizeupdashboard/convex/src/api/schema'
import { config } from '@/config'
import { api } from '@sizeupdashboard/convex/src/api/_generated/api.js'
import { Request, Response } from 'express'
import { FormattedDateTime, formatDateTime } from '@/lib/utils'
import { createDefaultRetryStats } from '@/lib/fetch-with-retry'

export interface FirstDueHydrant {
  facility_code: string
  firstdue_id: number
  client_code: string
  hydrant_type_code: string
  year: string | null
  fort_lauderdale_owner_code: string | null
  latitude: string
  longitude: string
  hydrant_status_code: string
  inspected_at: string
  area_ids_cache: string
  static_pressure: string
  residual_pressure: string
  residual_flow_rate: string
  hydrant_type_name: string
  address: string | null
  apparatus: string | null
  closest_address: string | null
  fire_zone: string | null
  inspected_by: string
  hydrant_zone: string | null
  xref_id: string | null
  base_color_code: string
  manufacturer: string
  num_outlet: number
  steamer_port: string
  outlet_size2: string
  outlet_size3: string
  source: string | null
  location: string
  cistern_capacity_gallons: string | null
  main_size: string | null
  barrel_size: string | null
  last_flow_tested_at: string
  water_department: string
  model: string | null
  notes: string | null
  is_private: boolean
  cistern_capacity_liters: string | null
  calculated_flow_rate: string
  fire_district: string | null
  valve_location: string | null
  placement: string | null
  fire_station: string | null
  shift: string | null
  assigned_user: string | null
  annual_maintenance: string | null
  reason_out_of_service: string | null
  hydrant_type_bg_color: string | null
  icon_file_path: string | null
  agency_name: string
  flow_hydrant_one: string
  flow_hydrant_two: string
  pitot_gauge_one: number
  pitot_gauge_two: number
  team_id: number
  assigned_team: string
  responsible_occupancy: string | null
  pressure_zone: string | null
  flowed_by: string
}

const HYDRANTS_INTERVAL = 1000 * 60 * 60 * 24 // 24 hours
const HYDRANTS_NAME = 'Hydrants'

interface HydrantsStats extends RoutineStats {
  totalHydrantsProcessed: number
  totalHydrantsCreated: number
  lastFetchTime?: FormattedDateTime
  lastUpdateTime?: FormattedDateTime
  averageApiResponseTime?: number
  averageProcessingTime?: number
}

interface Pagination {
  current_page: number
  total_pages: number
  total_hydrant_records: number
  total_hydrants_per_page: number
  has_more: boolean
  items: FirstDueHydrant[]
}

export class HydrantsRoutineRouter extends RoutineRouter {
  protected readonly interval: number = HYDRANTS_INTERVAL
  public stats: HydrantsStats = this.defaultStats()

  constructor(options: RoutineRouterOptions = {}) {
    super(HYDRANTS_NAME, {
      ...options,
      onStart: async () => {
        this.validateConfiguration()
        await options.onStart?.()
      },
      onStop: async () => {
        await options.onStop?.()
      },
    })
  }

  protected defaultStats(): HydrantsStats {
    return {
      apiCallCount: 0,
      totalHydrantsProcessed: 0,
      totalHydrantsCreated: 0,
      errorCount: 0,
      retryStats: createDefaultRetryStats(),
    }
  }

  protected defineRoutes(): void {
    this.addRoute('get', '/config', this.handleGetConfig.bind(this))
    this.addRoute(
      'get',
      '/test-connection',
      this.handleTestConnection.bind(this)
    )
    // this.addRoute('get', '/current-data', this.handleGetCurrentData.bind(this))
  }

  public async execute(): Promise<void> {
    try {
      this.validateConfiguration()

      const activeHydrants = await this.getHydrants('in_service')
      const inactiveHydrants = await this.getHydrants('out_of_service')
      const allHydrants = [...activeHydrants, ...inactiveHydrants]
      if (!allHydrants || allHydrants.length === 0) {
        this.ctx.logger.info('No hydrants data found, skipping update cycle')
        return
      }

      const parsedHydrants = allHydrants.map((hydrant) =>
        this.parseFirstDueHydrant(hydrant)
      )

      const batchSize = 100
      for (let i = 0; i < parsedHydrants.length; i += batchSize) {
        const batch = parsedHydrants.slice(i, i + batchSize)
        this.ctx.logger.info(
          `Creating hydrants batch ${i / batchSize + 1} with ${batch.length} hydrants`
        )
        const createdHydrantsBatch = await this.ctx.client.mutation(
          api.hydrants.paginatedCreateHydrants,
          {
            hydrants: batch,
            apiKey: config.convexApiKey,
          }
        )
        this.stats.totalHydrantsCreated += createdHydrantsBatch.length
        this.stats.totalHydrantsProcessed += batch.length
      }

      this.stats.lastUpdateTime = formatDateTime(new Date())

      this.ctx.logger.info('Hydrants update cycle completed successfully')
    } catch (error) {
      this.stats.errorCount++
      this.ctx.logger.error('Hydrants execution cycle failed', {
        error,
      })
      throw error
    }
  }

  // ==================== ROUTE HANDLERS ====================

  private async handleGetConfig(req: Request, res: Response): Promise<void> {
    res.json({
      hasApiKey: !!config.firstdueApiKey,
      hasApiUrl: !!config.firstdueApiUrl,
      interval: this.interval,
      intervalFormatted: this.getStatus().interval.formatted,
    })
  }

  private async handleTestConnection(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      this.validateConfiguration()

      const testTimer = this.ctx.logger.perf.start({
        id: 'testHydrantsConnection',
        printf: (duration: number) =>
          `Hydrants API connection test completed in ${duration}ms`,
      })

      this.ctx.logger.info('Testing FirstDue Hydrants API connection')

      const response = await this.fetchWithRetry(
        `${config.firstdueApiUrl}/get-hydrants`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.firstdueApiKey}`,
          },
        }
      )

      const responseTime = testTimer.end()

      if (!response.ok) {
        throw new Error(
          `API returned ${response.status}: ${response.statusText}`
        )
      }

      res.json({
        message: 'Hydrants API connection successful',
        status: response.status,
        responseTime: responseTime,
        headers: Object.fromEntries(response.headers.entries()),
      })
    } catch (error) {
      this.stats.errorCount++
      this.ctx.logger.error('Hydrants API connection test failed', {
        error,
      })
      throw error
    }
  }

  // ==================== CORE BUSINESS LOGIC ====================

  protected parseFirstDueHydrant(hydrant: FirstDueHydrant): PostHydrant {
    return {
      hydrantId: hydrant.firstdue_id,
      latitude: parseFloat(hydrant.latitude),
      longitude: parseFloat(hydrant.longitude),
      hydrantStatusCode: hydrant.hydrant_status_code,
      calculatedFlowRate: hydrant.calculated_flow_rate,
      notes: hydrant.notes,
      address: hydrant.address,
      numOutlet: hydrant.num_outlet,
    }
  }

  protected async getHydrants(
    hydrantStatusCode: 'in_service' | 'out_of_service' = 'in_service'
  ): Promise<FirstDueHydrant[]> {
    const fetchTimer = this.ctx.logger.perf.start({
      id: 'fetchHydrantsData',
      printf: (duration: number) =>
        `Get Hydrants API call completed in ${duration}ms`,
    })

    let hasNext = true
    let currentPage = 1
    const hydrants: FirstDueHydrant[] = []

    try {
      while (hasNext) {
        this.ctx.logger.info(
          `Fetching ${hydrantStatusCode} hydrants page ${currentPage}`
        )
        const response = await this.fetchWithRetry(
          `${config.firstdueApiUrl}/get-hydrants?hydrant_status_code=${hydrantStatusCode}&page=${currentPage}&limit=1000`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${config.firstdueApiKey}`,
            },
          }
        )

        const responseTime = fetchTimer.end()

        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`)
        }

        const data = (await response.json()) as Pagination
        this.ctx.logger.info(
          `${hydrantStatusCode} hydrants page ${currentPage} fetched in ${responseTime}ms`
        )

        hasNext = data.has_more
        hydrants.push(...data.items)
        currentPage++
      }
      return hydrants
    } catch (error) {
      this.stats.errorCount++
      this.ctx.logger.error('Hydrants API fetch failed', {
        message: (error as Error).message,
      })
      return []
    } finally {
      this.stats.lastFetchTime = formatDateTime(new Date())
      fetchTimer.end()
    }
  }

  private validateConfiguration(): void {
    if (!config.firstdueApiKey) {
      throw new Error('FIRSTDUE_API_KEY is not configured')
    }
    if (!config.firstdueApiUrl) {
      throw new Error('FIRSTDUE_API_URL is not configured')
    }
  }
}
