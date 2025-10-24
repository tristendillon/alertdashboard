'server-only'

import { Resource } from 'sst'

/**
 * Server-side only API configuration
 * Access SST Resources (only works in Server Components/API Routes)
 *
 * @example
 * // In a Server Component:
 * const apiUrl = getApiUrl();
 * return <MyComponent apiUrl={apiUrl} />
 */
export function getApiUrl(): string {
  return Resource.Api.url
}
