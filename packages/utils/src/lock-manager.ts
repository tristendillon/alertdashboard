import * as fs from 'fs'

export interface LockManagerOptions {
  /** Path to the lock file (default: /tmp/lock.lock) */
  lockFilePath?: string
  /** Timeout in seconds for stale lock detection (default: 90) */
  timeoutSeconds?: number
}

/**
 * Lock manager to prevent concurrent executions
 * Uses a file-based lock (useful for Lambda /tmp directory across warm invocations)
 */
export class LockManager {
  private lockFilePath: string
  private timeoutSeconds: number

  constructor(options: LockManagerOptions = {}) {
    this.lockFilePath = options.lockFilePath ?? '/tmp/lock.lock'
    this.timeoutSeconds = options.timeoutSeconds ?? 90
  }

  /**
   * Attempts to acquire a lock to prevent concurrent executions
   * @returns true if lock was acquired, false if another instance is running
   */
  tryAcquire(): boolean {
    try {
      // Check if lock file exists and is recent
      if (fs.existsSync(this.lockFilePath)) {
        const stats = fs.statSync(this.lockFilePath)
        const ageSeconds = (Date.now() - stats.mtimeMs) / 1000

        if (ageSeconds < this.timeoutSeconds) {
          console.log(
            `Lock file exists and is ${ageSeconds.toFixed(1)}s old, skipping this invocation`
          )
          return false
        } else {
          console.log(`Stale lock file found (${ageSeconds.toFixed(1)}s old), removing`)
          fs.unlinkSync(this.lockFilePath)
        }
      }

      // Create lock file
      fs.writeFileSync(this.lockFilePath, new Date().toISOString())
      console.log('Lock acquired')
      return true
    } catch (error) {
      console.error('Error managing lock file:', error)
      // If we can't manage the lock, proceed anyway to avoid blocking forever
      return true
    }
  }

  /**
   * Releases the lock file
   */
  release(): void {
    try {
      if (fs.existsSync(this.lockFilePath)) {
        fs.unlinkSync(this.lockFilePath)
        console.log('Lock released')
      }
    } catch (error) {
      console.error('Error releasing lock:', error)
    }
  }
}
