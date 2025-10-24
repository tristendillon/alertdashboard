import { alertsTable, syncMetadataTable } from './storage'
import { realtimeApi } from './realtime'

export { alertsTable, syncMetadataTable, realtimeApi }
export const resources = {
  alertsTable: alertsTable.name,
  syncMetadataTable: syncMetadataTable.name,
  realtimeEndpoint: realtimeApi.endpoint,
  realtimeAuthorizer: realtimeApi.authorizer,
}
