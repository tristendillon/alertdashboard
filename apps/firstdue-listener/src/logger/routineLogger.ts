import { BaseLogger, LogMeta } from './baseLogger'

export class RoutineLogger extends BaseLogger {
  private routineName: string

  constructor(routineName: string) {
    super(`Routine:${routineName}`)
    this.routineName = routineName
  }

  logStart(interval: number): void {
    const readableInterval = this.formatInterval(interval)
    this.info(
      `Starting ${this.routineName} routine with ${readableInterval} interval`
    )
  }

  private formatInterval(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days} day${days === 1 ? '' : 's'}`
    }
    if (hours > 0) {
      return `${hours} hour${hours === 1 ? '' : 's'}`
    }
    if (minutes > 0) {
      return `${minutes} minute${minutes === 1 ? '' : 's'}`
    }
    return `${seconds} second${seconds === 1 ? '' : 's'}`
  }

  logStop(): void {
    this.info(`${this.routineName} routine stopped`)
  }

  logExecution(timestamp: string): void {
    this.info(`${this.routineName} routine execution started`, { timestamp })
  }

  logExecutionError(error: Error | unknown): void {
    const errorMeta: LogMeta = {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }
    this.error(
      `Error: ${errorMeta.error} in ${this.routineName} routine`,
      errorMeta
    )
  }

  logAlreadyRunning(): void {
    this.warn(`${this.routineName} routine already running`)
  }
}
