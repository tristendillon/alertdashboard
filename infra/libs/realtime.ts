/**
 * Realtime pub/sub API for real-time communication
 * Serves as the sync/realtime layer between API, polling functions, and frontend
 */
export const realtimeApi = new sst.aws.Realtime('Realtime', {
  // Simple authorizer that allows all connections for now
  authorizer: {
    handler: 'infra/libs/realtime-authorizer.handler',
  },
})
