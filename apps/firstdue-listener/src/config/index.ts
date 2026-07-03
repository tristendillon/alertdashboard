import dotenv from 'dotenv'
import { z } from 'zod'

// Local dev loads env from files; in production the container/runtime injects
// env directly (Cloudflare Worker secrets/vars), so skip dotenv there.
// Aliasing process.env keeps this a genuine runtime check — tsup's
// replaceNodeEnv would otherwise inline `process.env.NODE_ENV` at build time
// and collapse the gate to a constant.
const runtimeEnv: NodeJS.ProcessEnv = process.env
if (runtimeEnv.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local', quiet: true })
  dotenv.config({ path: '.env', quiet: true })
}

export type LogLevel = 'error' | 'warn' | 'info' | 'timer' | 'debug' | 'verbose'
export type Environment = 'development' | 'production' | 'test'

const LOG_LEVELS = [
  'error',
  'warn',
  'info',
  'timer',
  'debug',
  'verbose',
] as const

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  TIMEZONE: z.string().min(1).default('America/Chicago'),
  LOG_LEVEL: z.enum(LOG_LEVELS).optional(),
  FIRSTDUE_API_KEY: z.string().min(1),
  WEATHER_API_KEY: z.string().min(1),
  WEATHER_LAT: z.string().min(1),
  WEATHER_LNG: z.string().min(1),
  WEATHER_UNITS: z.string().min(1).default('imperial'),
  CONVEX_URL: z.url(),
  CONVEX_API_KEY: z.string().min(1),
  // Optional: when unset the API/WebSocket run unauthenticated (a warning is
  // logged on every request).
  API_KEY: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment configuration:')
  for (const issue of parsed.error.issues) {
    const key = issue.path.join('.') || '(root)'
    console.error(`  - ${key}: ${issue.message}`)
  }
  process.exit(1)
}

const env = parsed.data

const logLevel: LogLevel =
  env.LOG_LEVEL ?? (env.NODE_ENV === 'development' ? 'debug' : 'info')

export const config = {
  port: env.PORT,
  environment: env.NODE_ENV as Environment,
  timezone: env.TIMEZONE,
  logLevel,
  firstdueApiKey: env.FIRSTDUE_API_KEY,
  firstdueApiUrl: 'https://sizeup.firstduesizeup.com/fd-api/v1',
  weather: {
    lat: env.WEATHER_LAT,
    lng: env.WEATHER_LNG,
    apiKey: env.WEATHER_API_KEY,
    units: env.WEATHER_UNITS,
  },
  convexUrl: env.CONVEX_URL,
  convexApiKey: env.CONVEX_API_KEY,
  appApiKey: env.API_KEY,
}
