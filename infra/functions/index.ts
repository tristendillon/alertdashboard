import { SyncFirstDueAlerts } from './sync-firstdue-alerts'
import { KeepApiWarm } from './keep-api-warm'

export { SyncFirstDueAlerts, KeepApiWarm }
export const resources = {
  SyncFirstDueAlerts: SyncFirstDueAlerts.nodes.function.name,
  KeepApiWarm: KeepApiWarm.nodes.function.name,
}
