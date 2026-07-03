import { EventEmitter } from 'events'
import { LogLevel } from '@/config'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: string
  [key: string]: unknown
}

export interface LogQuery {
  level?: string
  context?: string
  since?: string
  until?: string
  search?: string
  limit?: number
  offset?: number
}

type LogCallback = (entry: LogEntry) => void

const BUFFER_CAPACITY = 2000

class LogBroadcaster extends EventEmitter {
  private static instance: LogBroadcaster

  // In-memory ring buffer of the most recent log entries. Container disks are
  // ephemeral, so this replaces the old on-disk log files. History is volatile
  // and cleared on restart.
  private buffer: LogEntry[] = []
  public readonly capacity = BUFFER_CAPACITY

  private constructor() {
    super()
    this.setMaxListeners(100)
  }

  static getInstance(): LogBroadcaster {
    if (!LogBroadcaster.instance) {
      LogBroadcaster.instance = new LogBroadcaster()
    }
    return LogBroadcaster.instance
  }

  broadcast(entry: LogEntry): void {
    this.buffer.push(entry)
    if (this.buffer.length > this.capacity) {
      this.buffer.shift()
    }
    this.emit('log', entry)
  }

  /**
   * Query the ring buffer. Ports the previous file-based filterLogs() logic
   * verbatim: level/context comma lists, since/until, search — returned
   * newest-first, then offset/limit applied. `total` is the filtered count
   * before pagination.
   */
  query(q: LogQuery = {}): { logs: LogEntry[]; total: number } {
    // Newest-first
    let filtered = this.buffer.slice().reverse()

    if (q.level) {
      const levels = q.level.split(',')
      filtered = filtered.filter((log) => levels.includes(log.level))
    }

    if (q.context) {
      const contexts = q.context.split(',')
      filtered = filtered.filter(
        (log) => log.context && contexts.includes(log.context)
      )
    }

    if (q.since) {
      const since = new Date(q.since)
      filtered = filtered.filter((log) => new Date(log.timestamp) >= since)
    }

    if (q.until) {
      const until = new Date(q.until)
      filtered = filtered.filter((log) => new Date(log.timestamp) <= until)
    }

    if (q.search) {
      const searchLower = q.search.toLowerCase()
      filtered = filtered.filter(
        (log) =>
          log.message.toLowerCase().includes(searchLower) ||
          JSON.stringify(log).toLowerCase().includes(searchLower)
      )
    }

    const total = filtered.length
    const offset = q.offset ?? 0
    const logs =
      q.limit !== undefined
        ? filtered.slice(offset, offset + q.limit)
        : filtered.slice(offset)

    return { logs, total }
  }

  /**
   * Return the most recent entries (newest-first), optionally filtered to a
   * single context.
   */
  getRecent(limit = 50, context?: string): LogEntry[] {
    let entries = this.buffer
    if (context) {
      entries = entries.filter((log) => log.context === context)
    }
    return entries.slice(-limit).reverse()
  }

  subscribe(callback: LogCallback): () => void {
    this.on('log', callback)
    return () => this.off('log', callback)
  }
}

export const logBroadcaster = LogBroadcaster.getInstance()
