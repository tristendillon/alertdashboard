import { Router, Request, Response } from 'express'
import { logBroadcaster } from '@/logger'
import { config } from '@/config'

export const logsRouter: Router = Router()

interface LogsQuery {
  limit?: string
  offset?: string
  level?: string
  context?: string
  since?: string
  until?: string
  search?: string
}

logsRouter.get(
  '/',
  (req: Request<unknown, unknown, unknown, LogsQuery>, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit || '100', 10), 1000)
      const offset = parseInt(req.query.offset || '0', 10)

      const { logs, total } = logBroadcaster.query({
        level: req.query.level,
        context: req.query.context,
        since: req.query.since,
        until: req.query.until,
        search: req.query.search,
        limit,
        offset,
      })

      res.json({
        logs,
        total,
        limit,
        offset,
        bufferCapacity: logBroadcaster.capacity,
      })
    } catch {
      res.status(500).json({ error: 'Failed to read logs' })
    }
  }
)

logsRouter.get('/stream-info', (_req: Request, res: Response) => {
  res.json({
    websocket: {
      path: '/ws/logs',
      port: config.port,
      description: 'Connect to receive real-time log updates',
      filterExample: {
        levels: ['error', 'warn'],
        contexts: ['Dispatch'],
      },
    },
  })
})
