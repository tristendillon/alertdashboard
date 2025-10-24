import { Hono } from 'hono'
import { handle } from 'hono/aws-lambda'
import { cors } from 'hono/cors'
import v1 from './routes/v1/index'
import { logger } from 'hono/logger'
/**
 * Main Hono application
 * Exports AppType for frontend type-safe client
 */
const app = new Hono()
  // Enable CORS
  .use('/*', cors())
  .use('/*', logger())

  // Health check
  .route('/v1', v1)

// Export app type for frontend Hono client
export type AppType = typeof app

// Export Lambda handler
export const handler = handle(app)

// For local development
export default app
