import { alertsTable, syncMetadataTable } from '../libs/storage'
import { realtimeApi } from '../libs/realtime'

export const firstDueSyncCron = new sst.aws.Cron('FirstDueSyncCron', {
  job: {
    handler: 'functions/sync-firstdue-alerts/src/index.handler',
    timeout: '90 seconds',
    memory: '128 MB',
    link: [alertsTable, syncMetadataTable, realtimeApi],
    description: 'Sync FirstDue alerts to the database',
  },
  schedule: 'rate(1 minute)',
})
