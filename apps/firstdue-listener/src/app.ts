import express from 'express'
import expressWinston from 'express-winston'
import { winstonInstance } from '@/logger'
import { DispatchRoutineRouter } from './routes/dispatch'
import { RoutineRouter } from './routes/routineRouter'
import { WeatherRoutineRouter } from './routes/weather'
import { HydrantsRoutineRouter } from './routes/hydrants'
import { logsRouter } from './routes/logs'
import { authMiddleware } from './lib/auth-middleware'

export function createApp(): {
  app: express.Application
  routines: RoutineRouter[]
} {
  const app = express()

  // Express 5 sits behind the Cloudflare Worker proxy; trust it for req.ip etc.
  app.set('trust proxy', true)

  const dispatchRouter = new DispatchRoutineRouter()
  const weatherRouter = new WeatherRoutineRouter()
  const hydrantsRouter = new HydrantsRoutineRouter()

  const routineRoutes: RoutineRouter[] = [
    dispatchRouter,
    weatherRouter,
    hydrantsRouter,
  ]

  app.use(express.json())

  // Unauthenticated health probe, registered before request logging and auth so
  // cron/liveness probes stay out of the logs and ring buffer.
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  })

  app.use(
    expressWinston.logger({
      winstonInstance,
      meta: true,
      msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
      expressFormat: false,
      colorize: false,
    })
  )
  app.use(authMiddleware)

  routineRoutes.forEach(async (routineRouter) => {
    const routeName = routineRouter.name.toLowerCase()
    app.use(`/api/routines/${routeName}`, routineRouter.getRoutes())
    routineRouter.ctx.logger.info(
      `Mounted ${routineRouter.name} routes at /api/routines/${routeName} with ${routineRouter.routes.stack.length} routes`
    )
  })

  app.use('/api/logs', logsRouter)

  return { app, routines: routineRoutes }
}
