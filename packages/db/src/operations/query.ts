import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { docClient } from '../client'
import { TableName, EntityType, getTableName } from '../tables'

export interface QueryOptions {
  /**
   * Key condition expression
   * @example "#id = :id AND #timestamp > :timestamp"
   */
  keyConditionExpression: string

  /**
   * Expression attribute names
   * @example { "#id": "id" }
   */
  expressionAttributeNames?: Record<string, string>

  /**
   * Expression attribute values
   * @example { ":id": "123" }
   */
  expressionAttributeValues: Record<string, any>

  /**
   * Index name (for GSI queries)
   */
  indexName?: string

  /**
   * Maximum number of items to return
   */
  limit?: number

  /**
   * Exclusive start key for pagination
   */
  exclusiveStartKey?: Record<string, any>

  /**
   * Sort order (true = ascending, false = descending)
   */
  scanIndexForward?: boolean

  /**
   * Filter expression (applied after query)
   */
  filterExpression?: string
}

export interface QueryResult<T> {
  items: T[]
  lastEvaluatedKey?: Record<string, any>
  count: number
}

/**
 * Query items from DynamoDB
 * Returns items of the correct type automatically based on table name
 *
 * @example
 * const result = await query("Alerts", {
 *   keyConditionExpression: "#source = :source",
 *   expressionAttributeNames: { "#source": "source" },
 *   expressionAttributeValues: { ":source": "firstdue" },
 *   indexName: "sourceIndex"
 * });
 * // result.items is typed as Alert[]
 */
export async function query<T extends TableName>(
  table: T,
  options: QueryOptions
): Promise<QueryResult<EntityType<T>>> {
  const tableName = getTableName(table)

  const result = await docClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: options.keyConditionExpression,
      ExpressionAttributeNames: options.expressionAttributeNames,
      ExpressionAttributeValues: options.expressionAttributeValues,
      IndexName: options.indexName,
      Limit: options.limit,
      ExclusiveStartKey: options.exclusiveStartKey,
      ScanIndexForward: options.scanIndexForward,
      FilterExpression: options.filterExpression,
    })
  )

  return {
    items: (result.Items as EntityType<T>[]) || [],
    lastEvaluatedKey: result.LastEvaluatedKey,
    count: result.Count || 0,
  }
}
