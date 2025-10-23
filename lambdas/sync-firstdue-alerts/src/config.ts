/**
 * Configuration constants for the FirstDue sync Lambda
 */

export const CONFIG = {
  /** Number of sync iterations to run per batch */
  BATCH_SIZE: 12,

  /** Delay in seconds between each sync iteration */
  DELAY_SECONDS: 5,

  /** Lock file timeout in seconds (stale lock detection) */
  LOCK_TIMEOUT_SECONDS: 90,

  /** Path to the lock file in Lambda's /tmp directory */
  LOCK_FILE_PATH: '/tmp/sync-running.lock',
} as const
