/**
 * DynamoDB table for storing alerts
 * Supports both FirstDue and Active911 alerts
 */
export const alertsTable = new sst.aws.Dynamo("Alerts", {
  fields: {
    alertId: "string",
    timestamp: "number",
    status: "string",
  },
  primaryIndex: {
    hashKey: "alertId",
    rangeKey: "timestamp",
  },
  globalIndexes: {
    statusIndex: {
      hashKey: "status",
      rangeKey: "timestamp",
    },
  },
  stream: "new-and-old-images", // Enable streams for potential real-time processing
});

/**
 * DynamoDB table for sync metadata
 * Tracks last sync times, state, and execution history
 */
export const syncMetadataTable = new sst.aws.Dynamo("SyncMetadata", {
  fields: {
    syncType: "string", // "firstdue" or "active911"
    timestamp: "number",
  },
  primaryIndex: {
    hashKey: "syncType",
    rangeKey: "timestamp",
  },
});
