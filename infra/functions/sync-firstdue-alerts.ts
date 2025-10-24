import { AlertsTable } from '../storage'
import { RealtimeApi } from '../libs/realtime'

export const SyncFirstDueAlerts = new sst.aws.Cron('SyncFirstDueAlerts', {
  job: {
    handler: 'functions/sync-firstdue-alerts/src/index.handler',
    timeout: '90 seconds',
    memory: '128 MB',
    link: [AlertsTable, RealtimeApi],
    description: 'Sync FirstDue alerts to the database',
  },
  schedule: 'rate(1 minute)',
})
