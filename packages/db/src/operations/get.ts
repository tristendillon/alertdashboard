import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../client";
import { TableName, EntityType, KeyType, getTableName } from "../tables";

/**
 * Get an item from DynamoDB by its primary key
 * Returns the correct type automatically based on table name
 *
 * @example
 * const alert = await get("Alerts", { id: "123", timestamp: 456 });
 * // alert is typed as Alert | null (no casting needed!)
 */
export async function get<T extends TableName>(
  table: T,
  key: KeyType<T>
): Promise<EntityType<T> | null> {
  const tableName = getTableName(table);

  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: key as Record<string, any>,
    })
  );

  return (result.Item as EntityType<T>) || null;
}
