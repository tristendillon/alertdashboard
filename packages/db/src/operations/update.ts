import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../client";
import { TableName, KeyType, getTableName } from "../tables";

/**
 * Update an item in DynamoDB
 * Dynamically builds the update expression from the updates object
 *
 * @example
 * await update("Alerts",
 *   { id: "123", timestamp: 456 },
 *   { assignedTo: "user@example.com", updatedAt: Date.now() }
 * );
 */
export async function update<T extends TableName>(
  table: T,
  key: KeyType<T>,
  updates: Partial<Record<string, any>>
): Promise<void> {
  const tableName = getTableName(table);

  // Build update expression dynamically
  const updateExpression = Object.keys(updates)
    .map((_, i) => `#field${i} = :value${i}`)
    .join(", ");

  const expressionAttributeNames = Object.keys(updates).reduce(
    (acc, k, i) => ({
      ...acc,
      [`#field${i}`]: k,
    }),
    {}
  );

  const expressionAttributeValues = Object.values(updates).reduce(
    (acc, v, i) => ({
      ...acc,
      [`:value${i}`]: v,
    }),
    {}
  );

  await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: key as Record<string, any>,
      UpdateExpression: `SET ${updateExpression}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );
}
