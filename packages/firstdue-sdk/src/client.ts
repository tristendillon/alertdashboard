import type {
  FirstDueClientConfig,
  FirstDueAlert,
  FirstDueApiResponse,
  AlertFilterParams,
} from './types'

/**
 * FirstDue API Client
 * A lightweight SDK for interacting with the FirstDue API
 */
export class FirstDueClient {
  private config: Required<FirstDueClientConfig>

  constructor(config: FirstDueClientConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    }
  }

  /**
   * Makes an authenticated request to the FirstDue API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<FirstDueApiResponse<T>> {
    const url = `${this.config.apiUrl}${endpoint}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`, // TODO: Update auth header format based on FirstDue's requirements
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(
          `FirstDue API error: ${response.status} ${response.statusText}`
        )
      }

      const data = await response.json()
      return {
        success: true,
        data: data as T,
      }
    } catch (error) {
      clearTimeout(timeoutId)

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      return {
        success: false,
        data: null as any,
        error: errorMessage,
      }
    }
  }

  /**
   * Fetches alerts from FirstDue
   * TODO: Update endpoint and parameters based on actual FirstDue API
   */
  async getAlerts(
    filters?: AlertFilterParams
  ): Promise<FirstDueApiResponse<FirstDueAlert[]>> {
    const params = new URLSearchParams()

    if (filters?.startDate) params.append('start_date', filters.startDate)
    if (filters?.endDate) params.append('end_date', filters.endDate)
    if (filters?.type) params.append('type', filters.type)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const queryString = params.toString()
    const endpoint = `/alerts${queryString ? `?${queryString}` : ''}`

    return this.request<FirstDueAlert[]>(endpoint)
  }

  /**
   * Fetches a single alert by ID
   * TODO: Update endpoint based on actual FirstDue API
   */
  async getAlertById(id: string): Promise<FirstDueApiResponse<FirstDueAlert>> {
    return this.request<FirstDueAlert>(`/alerts/${id}`)
  }

  /**
   * Gets the current status/health of the FirstDue API
   * TODO: Add if FirstDue has a health/status endpoint
   */
  async getStatus(): Promise<
    FirstDueApiResponse<{ status: string; timestamp: string }>
  > {
    return this.request('/status')
  }

  // Add more methods as needed for your FirstDue integration:
  // - getIncidents()
  // - getUnits()
  // - getStations()
  // - etc.
}
