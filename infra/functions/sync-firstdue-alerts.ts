import { RealtimeApi } from '../libs/realtime'
import { Postgres } from '../postgres'

export const SyncFirstDueAlerts = new sst.aws.Cron('SyncFirstDueAlerts', {
  job: {
    handler: 'functions/sync-firstdue-alerts/src/index.handler',
    timeout: '90 seconds',
    memory: '128 MB',
    link: [RealtimeApi, Postgres],
    description: 'Sync FirstDue alerts to the database',
  },
  schedule: 'rate(1 minute)',
})
