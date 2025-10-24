import { ScanCommand } from '@aws-sdk/lib-dynamodb'
import { docClient } from '../client'
import { TableName, EntityType, getTableName } from '../tables'

export interface ScanOptions {
  /**
   * Filter expression (optional)
   * @example "#status = :status"
   */
  filterExpression?: string

  /**
   * Expression attribute names
   * @example { "#status": "status" }
   */
  expressionAttributeNames?: Record<string, string>

  /**
   * Expression attribute values
   * @example { ":status": "active" }
   */
  expressionAttributeValues?: Record<string, any>

  /**
   * Maximum number of items to return
   */
  limit?: number

  /**
   * Exclusive start key for pagination
   */
  exclusiveStartKey?: Record<string, any>

  /**
   * Index name (for scanning a GSI)
   */
  indexName?: string
}

export interface ScanResult<T> {
  items: T[]
  lastEvaluatedKey?: Record<string, any>
  count: number
  scannedCount: number
}

/**
 * Scan all items from DynamoDB table
 * Returns items of the correct type automatically based on table name
 *
 * @example
 * // Get all alerts
 * const result = await scan("Alerts", {
 *   limit: 20
 * });
 * // result.items is typed as Alert[]
 *
 * @example
 * // Get all alerts with filter
 * const result = await scan("Alerts", {
 *   filterExpression: "#source = :source",
 *   expressionAttributeNames: { "#source": "source" },
 *   expressionAttributeValues: { ":source": "firstdue" },
 *   limit: 20
 * });
 */
export async function scan<T extends TableName>(
  table: T,
  options?: ScanOptions
): Promise<ScanResult<EntityType<T>>> {
  const tableName = getTableName(table)

  const result = await docClient.send(
    new ScanCommand({
      TableName: tableName,
      FilterExpression: options?.filterExpression,
      ExpressionAttributeNames: options?.expressionAttributeNames,
      ExpressionAttributeValues: options?.expressionAttributeValues,
      Limit: options?.limit,
      ExclusiveStartKey: options?.exclusiveStartKey,
      IndexName: options?.indexName,
    })
  )

  return {
    items: (result.Items as EntityType<T>[]) || [],
    lastEvaluatedKey: result.LastEvaluatedKey,
    count: result.Count || 0,
    scannedCount: result.ScannedCount || 0,
  }
}
