import { RealtimeApi } from '../libs/realtime'
import { Postgres } from '../postgres'

/**
 * API Lambda Function
 * Hono-based REST API for the Alert Dashboard
 */
export const Api = new sst.aws.Function('Api', {
  handler: 'apps/api/src/index.handler',
  url: {
    cors: false, // Disable Lambda Function URL CORS - Hono handles it
  },
  link: [RealtimeApi, Postgres],
  timeout: '30 seconds',
  memory: '1024 MB',
})

/**
 * CloudFront distribution with custom domain
 * Routes all requests to Lambda Function URL
 *
 * Domain structure:
 * - production: api.mfd.alertdashboard.com
 * - dev: dev.api.mfd.alertdashboard.com
 * - preview: preview.api.mfd.alertdashboard.com
 * - local (sst dev): No custom domain, uses CloudFront URL
 */
