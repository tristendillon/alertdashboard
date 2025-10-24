/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'alertdashboard',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      protect: ['production'].includes(input?.stage),
      home: 'aws',
    }
  },
  async run() {
    const infra = await import('./infra')
    const resources = {
      ...infra.functions.resources,
      ...infra.libs.resources,
      ...infra.apps.resources,
    }

    // Return outputs for easy access
    return resources
  },
})
