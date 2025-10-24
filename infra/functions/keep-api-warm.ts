import { Api } from '../apps/api'

/**
 * Keep API Warm Cron
 * Pings the API every 5 minutes to prevent cold starts
 * This ensures faster response times for actual user requests
 */
export const KeepApiWarm = new sst.aws.Cron('KeepApiWarm', {
  schedule: 'rate(5 minutes)',
  job: {
    handler: 'functions/keep-api-warm/src/index.handler',
    link: [Api],
    timeout: '30 seconds',
    memory: '128 MB', // Minimal memory needed for HTTP request
  },
})
