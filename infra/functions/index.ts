import { firstDueSyncCron } from './sync-firstdue-alerts'

export { firstDueSyncCron }
export const resources = {
  syncFirstDueAlerts: firstDueSyncCron.nodes.function.name,
}
