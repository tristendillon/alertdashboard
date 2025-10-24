'use client'

import { createContext, useContext } from 'react'
import { createApiClient } from '@/lib/api-client'

type ApiClient = ReturnType<typeof createApiClient>

const ApiContext = createContext<ApiClient | null>(null)

interface ApiProviderProps {
  apiUrl: string
  children: React.ReactNode
}

/**
 * API Provider
 * Provides type-safe API client to all child components
 *
 * @param apiUrl - The API URL from SST Resource (passed from server)
 *
 * @example
 * // In layout.tsx (Server Component):
 * import { getApiUrl } from "@/lib/api-config.server";
 *
 * export default function Layout({ children }) {
 *   const apiUrl = getApiUrl();
 *   return <ApiProvider apiUrl={apiUrl}>{children}</ApiProvider>;
 * }
 */
export function ApiProvider({ apiUrl, children }: ApiProviderProps) {
  const client = createApiClient(apiUrl)
  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>
}

/**
 * Hook to access the type-safe API client
 * Must be used within ApiProvider
 *
 * @example
 * const client = useApiClient();
 * const res = await client.v1.alerts.$get();
 */
export function useApiClient() {
  const client = useContext(ApiContext)
  if (!client) {
    throw new Error('useApiClient must be used within ApiProvider')
  }
  return client
}
