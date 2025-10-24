import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../client";
import { TableName, KeyType, getTableName } from "../tables";

/**
 * Delete an item from DynamoDB by its primary key
 * Type-checks that the key matches the table's key structure
 *
 * @example
 * await deleteItem("Alerts", { id: "123", timestamp: 456 });
 */
export async function deleteItem<T extends TableName>(
  table: T,
  key: KeyType<T>
): Promise<void> {
  const tableName = getTableName(table);

  await docClient.send(
    new DeleteCommand({
      TableName: tableName,
      Key: key as Record<string, any>,
    })
  );
}
