import { Hono } from 'hono'
import { HealthCheckSchema } from '@alertdashboard/schemas'

const health = new Hono().get('/', (c) => {
  const healthCheck = HealthCheckSchema.parse({
    status: 'healthy',
    timestamp: Date.now(),
    version: '0.1.0',
  })
  return c.json(healthCheck)
})

export default health
