import { alertsTable, syncMetadataTable } from './storage'

export const firstDueSyncCron = new sst.aws.Cron('FirstDueSyncCron', {
  job: {
    handler: 'packages/functions/sync-firstdue-alerts/src/index.handler',
    timeout: '1 minute',
    memory: '128 MB',
    link: [alertsTable, syncMetadataTable],
  },
  schedule: 'rate(1 minute)',
})
