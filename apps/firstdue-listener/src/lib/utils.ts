import { config } from '@/config'

export function formatInterval(interval: number): string {
  const ms = interval

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  const remainingHours = hours % 24
  const remainingMinutes = minutes % 60
  const remainingSeconds = seconds % 60

  const parts: string[] = []

  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`)
  if (remainingHours > 0)
    parts.push(`${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`)
  if (remainingMinutes > 0)
    parts.push(`${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`)
  if (remainingSeconds > 0 && parts.length === 0) {
    parts.push(`${remainingSeconds}s`)
  }

  if (parts.length > 1) {
    const last = parts.pop()
    return parts.join(', ') + ' and ' + last
  }

  return parts[0] || `${ms}ms`
}

export function formatTimezoneDate(date: Date, timezone = config.timezone) {
  return date.toLocaleString('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  })
}

export interface FormattedDateTime {
  iso: string
  unix: number
  timezone: string
  readable: string
  formatted: string
}
export function formatDateTime(
  dateInput: number | string | Date,
  timezone = config.timezone
) {
  // Convert input to Date object
  let date: Date

  if (typeof dateInput === 'number') {
    // Unix timestamp (assume seconds if < 1e12, milliseconds if >= 1e12)
    date = new Date(dateInput < 1e12 ? dateInput * 1000 : dateInput)
  } else if (typeof dateInput === 'string') {
    // ISO string or other date string
    date = new Date(dateInput)
  } else if (dateInput instanceof Date) {
    // Already a Date object
    date = dateInput
  } else {
    throw new Error(
      'Invalid date input. Use Unix timestamp, ISO string, or Date object.'
    )
  }

  // Validate the date
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date provided')
  }

  // Get current time for relative calculation
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  // Format relative time
  function getRelativeTime(diffMs) {
    const absDiff = Math.abs(diffMs)
    const seconds = Math.floor(absDiff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const weeks = Math.floor(days / 7)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)

    const future = diffMs < 0
    const prefix = future ? 'in ' : ''
    const suffix = future ? '' : ' ago'

    if (seconds < 10) return 'just now'
    if (seconds < 60)
      return `${prefix}${seconds} second${seconds !== 1 ? 's' : ''}${suffix}`
    if (minutes < 60)
      return `${prefix}${minutes} minute${minutes !== 1 ? 's' : ''}${suffix}`
    if (hours < 24)
      return `${prefix}${hours} hour${hours !== 1 ? 's' : ''}${suffix}`
    if (days < 7) return `${prefix}${days} day${days !== 1 ? 's' : ''}${suffix}`
    if (weeks < 4)
      return `${prefix}${weeks} week${weeks !== 1 ? 's' : ''}${suffix}`
    if (months < 12)
      return `${prefix}${months} month${months !== 1 ? 's' : ''}${suffix}`
    return `${prefix}${years} year${years !== 1 ? 's' : ''}${suffix}`
  }

  // Create formatted output
  const result = {
    iso: date.toISOString(),
    unix: Math.floor(date.getTime() / 1000),
    timezone: timezone,
    readable: formatTimezoneDate(date, timezone),
    formatted: date.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
    relative: getRelativeTime(diffMs),
    timestamp: date.getTime(),
  }

  return result
}
