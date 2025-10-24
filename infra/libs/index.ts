import { RealtimeApi } from './realtime'

export * from './realtime'

export const resources = {
  RealtimeApi: RealtimeApi.endpoint,
  RealtimeAuthorizer: RealtimeApi.authorizer,
}
