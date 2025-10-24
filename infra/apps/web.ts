import { RealtimeApi } from '../libs/realtime'
import { Api } from './api'

/**
 * Next.js Web Application
 *
 * Domain structure:
 * - production: mfd.alertdashboard.com
 * - dev: dev.mfd.alertdashboard.com
 * - preview: preview.mfd.alertdashboard.com
 * - local (sst dev): No custom domain, uses CloudFront URL
 */
export const Web = new sst.aws.Nextjs('Web', {
  path: 'apps/web',
  link: [RealtimeApi, Api],
})
