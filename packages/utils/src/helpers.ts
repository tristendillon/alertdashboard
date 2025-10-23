/**
 * Utility functions
 */

/**
 * Sleeps for the specified number of milliseconds
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the specified delay
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Formats a duration in seconds to a human-readable string
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "45.2s")
 */
export const formatDuration = (seconds: number): string => {
  return `${seconds.toFixed(1)}s`
}

/**
 * Calculates elapsed time since a start time
 * @param startTime - Start timestamp from Date.now()
 * @returns Elapsed time in seconds
 */
export const getElapsedSeconds = (startTime: number): number => {
  return (Date.now() - startTime) / 1000
}
