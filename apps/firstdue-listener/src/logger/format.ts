import winston from 'winston'
import moment from 'moment-timezone'
import chalk from 'chalk'
import { config, LogLevel } from '@/config'

interface LogInfo {
  timestamp: string
  level: LogLevel
  message: string
  context?: string
  [key: string]: unknown
}

const levelColors: Record<string, typeof chalk.red> = {
  error: chalk.red,
  warn: chalk.yellow,
  info: chalk.blue,
  timer: chalk.green,
  debug: chalk.gray,
  verbose: chalk.cyan,
}

const prettyFormat = winston.format.printf(
  (info: winston.Logform.TransformableInfo) => {
    const { timestamp, level, message, context, ...meta } =
      info as unknown as LogInfo

    const coloredTimestamp = chalk.gray(String(timestamp))
    const displayLevel = level === 'timer' ? 'TIMER' : level.toUpperCase()
    const coloredLevel = (levelColors[level] || chalk.white)(displayLevel)
    const coloredContext = context ? chalk.magenta(`[${context}]`) + ' ' : ''
    const coloredMessage = chalk.white(String(message))
    const coloredMeta =
      Object.keys(meta).length > 0
        ? ' ' + chalk.dim(JSON.stringify(meta, null, 2))
        : ''

    return `${coloredTimestamp} ${coloredLevel} ${coloredContext}${coloredMessage}${coloredMeta}`
  }
)

/**
 * Shared console format for every winston logger.
 * - TTY (local dev): the existing chalk pretty output.
 * - Non-TTY (docker / Cloudflare): single-line JSON so log capture ingests
 *   structured one-line entries.
 */
export function createConsoleFormat(): winston.Logform.Format {
  const timestamp = winston.format.timestamp({
    format: () =>
      moment().tz(config.timezone).format('YYYY-MM-DD HH:mm:ss.SSS Z'),
  })
  const errors = winston.format.errors({ stack: true })

  return winston.format.combine(
    timestamp,
    errors,
    process.stdout.isTTY ? prettyFormat : winston.format.json()
  )
}
