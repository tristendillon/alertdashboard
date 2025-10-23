/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'alertdashboard',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
    }
  },
  async run() {
    // Import and create infrastructure resources
    const storage = await import('./infra/storage')
    const cron = await import('./infra/cron')
    const api = await import('./infra/api')

    // Return outputs for easy access
    return {
      AlertsTable: storage.alertsTable.name,
      SyncMetadataTable: storage.syncMetadataTable.name,
      FirstDueSyncCron: cron.firstDueSyncCron.nodes.function.name,
      ApiUrl: api.api.url,
    }
  },
})
