import {
  sleep,
  getElapsedSeconds,
  formatDuration,
  LockManager,
} from '@alertdashboard/utils'
import { CONFIG } from './config'
import { FirstDueSyncService } from './services/firstdue-sync'
import {
  IoTDataPlaneClient,
  PublishCommand,
} from '@aws-sdk/client-iot-data-plane'
import { Resource } from 'sst'

/**
 * AWS Lambda handler for FirstDue alert synchronization
 * Runs 12 sequential sync iterations with 5-second delays
 */
export const handler = async () => {
  const lockManager = new LockManager({
    lockFilePath: CONFIG.LOCK_FILE_PATH,
    timeoutSeconds: CONFIG.LOCK_TIMEOUT_SECONDS,
  })
  const syncService = new FirstDueSyncService()

  // Try to acquire lock - if another instance is running, skip this execution
  if (!lockManager.tryAcquire()) {
    console.log('Another instance is already running, exiting')
    return
  }

  const startTime = Date.now()
  console.log(`Starting FirstDue sync batch at ${new Date().toISOString()}`)

  let successCount = 0
  let errorCount = 0

  try {
    // Execute sequential sync iterations with delays
    for (let i = 0; i < CONFIG.BATCH_SIZE; i++) {
      try {
        await syncService.syncAlerts(i)
        successCount++
      } catch (error) {
        // Log error but continue with remaining iterations
        console.error(`Error in iteration ${i + 1}:`, error)
        errorCount++
      }

      // Wait between iterations (except after the last one)
      if (i < CONFIG.BATCH_SIZE - 1) {
        await sleep(CONFIG.DELAY_SECONDS * 1000)
      }
    }

    const duration = getElapsedSeconds(startTime)
    console.log(
      `Batch complete: ${successCount} successful, ${errorCount} errors, ${formatDuration(
        duration
      )} total`
    )

    // Publish heartbeat to real-time API
    try {
      const iotClient = new IoTDataPlaneClient({
        endpoint: `https://${Resource.Realtime.endpoint}`,
      })

      const heartbeat = {
        timestamp: new Date().toISOString(),
        status: 'completed',
        successCount,
        errorCount,
        duration: formatDuration(duration),
      }

      // Topic format: app/stage/channel
      const topic = `${Resource.App.name}/${Resource.App.stage}/cron/heartbeat`

      const command = new PublishCommand({
        topic,
        payload: JSON.stringify(heartbeat),
        qos: 0, // At most once delivery
      })

      await iotClient.send(command)
      console.log('Heartbeat published to topic:', topic)
    } catch (error) {
      console.error('Failed to publish heartbeat:', error)
    } finally {
    }
  } finally {
    // Always release the lock, even if there was an error
    lockManager.release()
  }
}
