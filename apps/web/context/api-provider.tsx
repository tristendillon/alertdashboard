'use client'

import { createContext, useContext, useMemo } from 'react'
import { hc } from 'hono/client'
import type { AppType } from '@alertdashboard/api/src'

type ApiClient = ReturnType<typeof hc<AppType>>

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
  const client = useMemo(() => hc<AppType>(apiUrl), [apiUrl])
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
