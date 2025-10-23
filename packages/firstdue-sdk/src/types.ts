/**
 * FirstDue API Types
 * TODO: Update these types based on actual FirstDue API responses
 */

/**
 * Configuration options for FirstDue client
 */
export interface FirstDueClientConfig {
  /** API base URL (e.g., https://api.firstdue.com) */
  apiUrl: string
  /** API authentication key */
  apiKey: string
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number
}

/**
 * FirstDue Alert/Incident
 * TODO: Replace with actual alert structure from FirstDue API
 */
export interface FirstDueAlert {
  id: string
  incidentNumber?: string
  timestamp: string
  type: 'fire' | 'ems' | 'other'
  priority: number
  location: {
    address: string
    latitude?: number
    longitude?: number
  }
  units?: string[]
  status: 'dispatched' | 'en_route' | 'on_scene' | 'resolved'
  description?: string
  // Add more fields based on your FirstDue API response
}

/**
 * Response wrapper for FirstDue API
 */
export type FirstDueApiResponse<T = unknown> =
  | { success: true; data: T; error?: undefined }
  | { success: false; data: null; error: string }

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * Filter parameters for alerts
 */
export interface AlertFilterParams extends PaginationParams {
  startDate?: string
  endDate?: string
  type?: 'fire' | 'ems' | 'other'
  status?: string
}
