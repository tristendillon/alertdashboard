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
      ...infra.postgres.resources,
    }
    // Return outputs for easy access
    return resources
  },
  console: {
    autodeploy: {
      target(event) {
        return {
          stage: 'development',
          // stage: event.type === 'pull_request' ? 'development' : 'production',
        }
      },
      async workflow({ $, event }) {
        await $`npm install -g bun`
        await $`bun install`
        event.action === 'removed'
          ? await $`bun sst remove`
          : await $`bun sst deploy`
        await $`bun run --cwd packages/db db:generate`
        await $`bun run --cwd packages/db db:migrate`
      },
    },
  },
})
