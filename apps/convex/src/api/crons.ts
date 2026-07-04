import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

// Prune view-token clients that stopped pinging so presence counts drop to
// offline and the table stays small. Deletion also triggers the reactive
// getActiveViewTokenClients query to re-run.
crons.interval(
  'cleanup stale view token clients',
  { minutes: 1 },
  internal.viewToken.cleanupStaleViewTokenClients,
  {}
)

export default crons
