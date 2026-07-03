import winston from 'winston'
import moment from 'moment-timezone'
import { config, type LogLevel } from '@/config'
import { logBroadcaster, LogEntry } from './logBroadcaster'

interface BroadcastInfo {
  timestamp?: string
  level: LogLevel
  message: string
  context?: string
  [key: string]: unknown
}

// winston re-exports the base transport class at runtime as `winston.Transport`,
// but its type definitions only expose the instance type as `winston.transport`.
// Bridging the two lets us extend the base transport without depending on the
// `winston-transport` package directly.
const TransportBase = (
  winston as unknown as {
    Transport: new (
      opts?: winston.transport.TransportStreamOptions
    ) => winston.transport
  }
).Transport

class BroadcastTransport extends TransportBase {
  log(info: BroadcastInfo, callback: () => void): void {
    setImmediate(() => {
      const { timestamp, level, message, context, ...meta } = info
      const entry: LogEntry = {
        timestamp:
          timestamp ||
          moment().tz(config.timezone).format('YYYY-MM-DD HH:mm:ss.SSS Z'),
        level,
        message,
        context,
        ...meta,
      }
      logBroadcaster.broadcast(entry)
    })
    callback()
  }
}

export const broadcastTransport = new BroadcastTransport()
