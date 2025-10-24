const fields = {
  id: 'string',
  type: 'string',
  timestamp: 'number',
  source: 'string',
} as const

const indexes = {
  localIndexes: {},
  primaryIndex: {
    hashKey: 'id',
  },
  globalIndexes: {
    sourceIndex: {
      hashKey: 'source',
      rangeKey: 'timestamp',
    },
    timestampIndex: {
      hashKey: 'type',
      rangeKey: 'timestamp',
    },
  },
} as const

/**
 * DynamoDB table for storing alerts
 * Supports both FirstDue and Active911 alerts
 * Schema matches AlertDbSchema from @alertdashboard/schemas
 */
const table = new sst.aws.Dynamo('Alerts', {
  fields,
  primaryIndex: indexes.primaryIndex,
  globalIndexes: indexes.globalIndexes,
  stream: 'new-and-old-images', // Enable streams for potential real-time processing
})

export const AlertsTable = {
  table,
  fields,
  indexes,
}
