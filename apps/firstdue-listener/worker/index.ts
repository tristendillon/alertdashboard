import { Container, getContainer } from '@cloudflare/containers'

// Secrets are provided via `wrangler secret put` and are NOT declared in
// wrangler.jsonc, so `wrangler types` does not know about them. Augment the
// generated Env with the secret keys the container needs.
declare global {
  interface Env {
    FIRSTDUE_API_KEY: string
    WEATHER_API_KEY: string
    CONVEX_API_KEY: string
    CONVEX_URL: string
    API_KEY?: string
  }
}

/**
 * Supervisor Durable Object that runs the firstdue-listener container image.
 * No `sleepAfter` → the instance runs until the host restarts; the cron trigger
 * below restarts it by probing /health.
 */
export class FirstdueListenerContainer extends Container<Env> {
  defaultPort = 8080

  // Forward Worker vars + secrets into the container process env. The listener
  // validates these on boot (zod).
  envVars = ((): Record<string, string> => {
    const vars: Record<string, string> = {
      NODE_ENV: 'production',
      PORT: '8080',
      TIMEZONE: this.env.TIMEZONE,
      LOG_LEVEL: this.env.LOG_LEVEL,
      WEATHER_LAT: this.env.WEATHER_LAT,
      WEATHER_LNG: this.env.WEATHER_LNG,
      CONVEX_URL: this.env.CONVEX_URL,
      FIRSTDUE_API_KEY: this.env.FIRSTDUE_API_KEY,
      WEATHER_API_KEY: this.env.WEATHER_API_KEY,
      CONVEX_API_KEY: this.env.CONVEX_API_KEY,
    }
    if (this.env.API_KEY) vars.API_KEY = this.env.API_KEY
    return vars
  })()
}

export default {
  // Proxy all HTTP requests and WebSocket upgrades to the single container.
  async fetch(request: Request, env: Env): Promise<Response> {
    return getContainer(env.LISTENER).fetch(request)
  },

  // Cron: probe /health through the container so it auto-starts after a host
  // restart. Failures are logged (surfaced via Workers observability).
  async scheduled(
    _controller: ScheduledController,
    env: Env
  ): Promise<void> {
    try {
      const res = await getContainer(env.LISTENER).fetch(
        new Request('http://container/health')
      )
      if (!res.ok) {
        console.error(`Listener health probe returned ${res.status}`)
      }
    } catch (err) {
      console.error('Listener health probe failed', err)
    }
  },
}
