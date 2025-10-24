import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../client";
import { TableName, EntityType, getTableName } from "../tables";

/**
 * Put an item into DynamoDB
 * Type-checks that the item matches the table's entity type
 *
 * @example
 * await put("Alerts", {
 *   id: "123",
 *   timestamp: Date.now(),
 *   source: "firstdue",
 *   alertData: { ... },
 *   createdAt: Date.now()
 * });
 * // TypeScript validates this matches Alert type!
 */
export async function put<T extends TableName>(
  table: T,
  item: EntityType<T>
): Promise<void> {
  const tableName = getTableName(table);

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: item as Record<string, any>,
    })
  );
}
