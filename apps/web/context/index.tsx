'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApiProvider } from './api-provider'

interface ProvidersProps {
  children: React.ReactNode
  apiUrl: string
}

const queryClient = new QueryClient()
export function Providers({ children, apiUrl }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ApiProvider apiUrl={apiUrl}>{children}</ApiProvider>
    </QueryClientProvider>
  )
}
