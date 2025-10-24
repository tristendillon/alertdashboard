import { realtimeApi } from '../libs/realtime'

export const web = new sst.aws.Nextjs('Web', {
  path: 'apps/web',
  link: [realtimeApi],
  // domain: {
  //   name: 'alertdashboard.com',
  //   redirects: ['www.alertdashboard.com'],
  // },
})
