import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApiClient } from '@/context/api-provider'
import { UpdateAlert } from '@alertdashboard/schemas'
/**
 * Get all alerts with TanStack Query
 */
export function useAlerts(params?: {
  limit?: number
  sortOrder?: 'asc' | 'desc'
}) {
  const client = useApiClient()

  return useQuery({
    queryKey: ['alerts', params],
    queryFn: async () => {
      const res = await client.v1.alerts.$get({
        query: {
          limit: params?.limit?.toString() || '20',
          sortOrder: params?.sortOrder || 'desc',
        },
      })
      if (!res.ok) throw new Error('Failed to fetch alerts')
      return await res.json()
    },
  })
}

/**
 * Create alert mutation with optimistic updates
 */
export function useCreateAlert() {
  const client = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await client.v1.alerts.$post({ json: data })
      if (!res.ok) throw new Error('Failed to create alert')
      return await res.json()
    },
    onMutate: async (newAlert) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['alerts'] })

      // Snapshot previous value
      const previous = queryClient.getQueryData(['alerts'])

      // Optimistically update
      queryClient.setQueryData(['alerts'], (old: any) => ({
        ...old,
        items: [
          { id: 'temp-' + Date.now(), ...newAlert },
          ...(old?.items || []),
        ],
      }))

      return { previous }
    },
    onError: (err, newAlert, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['alerts'], context.previous)
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

/**
 * Delete alert mutation
 */
export function useDeleteAlert() {
  const client = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await client.v1.alerts[':id'].$delete({
        param: { id },
      })
      if (!res.ok) throw new Error('Failed to delete alert')
      return await res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

export function usePatchAlert(id: string) {
  const client = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateAlert) => {
      const res = await client.v1.alerts[':id'].$patch({
        param: { id },
        json: data,
      })
      if (!res.ok) throw new Error('Failed to patch alert')
      return await res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}
