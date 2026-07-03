import { BaseLogger } from '@/logger'
import { RoutineStats } from '@/routes/routineRouter'

// Retry configuration interface
export interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  jitterMax: number
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelayMs: 1000, // Start with 1 second
  maxDelayMs: 30000, // Cap at 30 seconds
  backoffMultiplier: 2,
  jitterMax: 0.1, // Add up to 10% jitter
}

// Stats interface for tracking retry behavior
export interface RetryStats {
  totalRetryAttempts: number
  successfulRetries: number
  failedRetries: number
  longestBackoffMs: number
}

// Context interface for passing dependencies
export interface FetchContext {
  logger: BaseLogger
  stats?: RoutineStats
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Exponential backoff with jitter calculation
 */
function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const exponentialDelay =
    config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt)
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs)

  // Add jitter to prevent thundering herd
  const jitter = cappedDelay * config.jitterMax * Math.random()
  const finalDelay = cappedDelay + jitter

  return Math.round(finalDelay)
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === 'fetch failed') {
    // Check the cause for specific network errors
    const cause = (error as any).cause
    if (cause) {
      // Retry on connection timeouts, connection refused, DNS errors, etc.
      return (
        cause.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        cause.code === 'ECONNREFUSED' ||
        cause.code === 'ENOTFOUND' ||
        cause.code === 'ECONNRESET' ||
        cause.code === 'ETIMEDOUT'
      )
    }
    return true // Generic fetch failed, assume retryable
  }

  // Also retry on HTTP 5xx errors and 429 (rate limit)
  if (error instanceof Error && error.message.includes('Failed to fetch')) {
    return true
  }

  return false
}

/**
 * Enhanced fetch with exponential backoff retry logic
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param context - Context containing logger and optional stats
 * @param retryConfig - Optional retry configuration (uses defaults if not provided)
 * @returns Promise<Response>
 */
export async function fetchWithRetry(
  url: URL | string,
  options: RequestInit,
  context: FetchContext,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<Response> {
  const { logger, stats } = context
  const urlString = url.toString()
  let lastError: unknown

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      // Increment API call count if stats are provided
      if (stats) {
        stats.apiCallCount++
      }

      if (attempt > 0) {
        if (stats) {
          stats.retryStats.totalRetryAttempts++
        }
        logger.info(
          `Retry attempt ${attempt}/${retryConfig.maxRetries} for ${urlString}`
        )
      }

      const response = await fetch(url, options)

      // Check for HTTP errors that should trigger retry
      if (!response.ok) {
        const statusCode = response.status
        if (statusCode >= 500 || statusCode === 429) {
          throw new Error(`HTTP ${statusCode}: ${response.statusText}`)
        }
        // For 4xx errors (except 429), don't retry
        throw new Error(`HTTP ${statusCode}: ${response.statusText}`)
      }

      if (attempt > 0) {
        if (stats) {
          stats.retryStats.successfulRetries++
        }
        logger.info(`Retry succeeded on attempt ${attempt}`)
      }

      return response
    } catch (error) {
      lastError = error

      // If this is the last attempt or error is not retryable, break
      if (
        attempt === retryConfig.maxRetries ||
        !isRetryableError(error)
      ) {
        if (attempt > 0 && stats) {
          stats.retryStats.failedRetries++
        }
        if (stats) {
          stats.errorCount++
        }
        break
      }

      // Calculate backoff delay
      const delayMs = calculateBackoffDelay(attempt, retryConfig)
      if (stats) {
        stats.retryStats.longestBackoffMs = Math.max(
          stats.retryStats.longestBackoffMs,
          delayMs
        )
      }

      logger.warn(
        `Fetch failed (attempt ${attempt + 1}/${
          retryConfig.maxRetries + 1
        }), retrying in ${delayMs}ms`,
        { error: error instanceof Error ? error.message : String(error) }
      )

      await sleep(delayMs)
    }
  }

  // If we get here, all retries failed
  throw lastError
}

/**
 * Create default retry stats object
 */
export function createDefaultRetryStats(): RetryStats {
  return {
    totalRetryAttempts: 0,
    successfulRetries: 0,
    failedRetries: 0,
    longestBackoffMs: 0,
  }
}

/**
 * Create a bound fetch function with pre-configured context and retry config
 * This is useful for classes that want to reuse the same configuration
 */
export function createBoundFetchWithRetry(
    context: FetchContext,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ) {
    return (url: URL | string, options: RequestInit = {}): Promise<Response> => {
      return fetchWithRetry(url, options, context, retryConfig)
    }
  }