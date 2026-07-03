export { BaseLogger, type LogMeta } from './baseLogger'
export type { LogLevel } from '@/config'
export { RoutineLogger } from './routineLogger'
export { logBroadcaster, type LogEntry } from './logBroadcaster'

import winston from 'winston'
import { config } from '@/config'
import { createConsoleFormat } from './format'

export const winstonInstance = winston.createLogger({
  level: config.logLevel,
  format: createConsoleFormat(),
  transports: [new winston.transports.Console()],
})
