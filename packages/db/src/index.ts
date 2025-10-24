/**
 * @alertdashboard/db
 * Type-safe DynamoDB operations
 * No casting needed - types are inferred from table names!
 */

// Table utilities
export {
  TABLES,
  getTableName,
  type TableName,
  type EntityType,
  type KeyType,
} from './tables'

// Client (if needed for advanced use cases)
export { docClient } from './client'

/**
 * Main db namespace for convenient usage
 *
 * @example
 * import { db } from "@alertdashboard/db";
 *
 * // Get an alert (automatically typed as Alert | null)
 * const alert = await db.get("Alerts", { id: "123", timestamp: 456 });
 *
 * // Create an alert (type-checked)
 * await db.put("Alerts", {
 *   id: "123",
 *   timestamp: Date.now(),
 *   source: "firstdue",
 *   alertData: { ... },
 *   createdAt: Date.now()
 * });
 *
 * // Query alerts (returns Alert[])
 * const { items } = await db.query("Alerts", {
 *   keyConditionExpression: "#source = :source",
 *   expressionAttributeNames: { "#source": "source" },
 *   expressionAttributeValues: { ":source": "firstdue" },
 *   indexName: "sourceIndex"
 * });
 *
 * // Update an alert
 * await db.update("Alerts",
 *   { id: "123", timestamp: 456 },
 *   { assignedTo: "user@example.com" }
 * );
 *
 * // Delete an alert
 * await db.deleteItem("Alerts", { id: "123", timestamp: 456 });
 */
import { get } from './operations/get'
import { put } from './operations/put'
import { query } from './operations/query'
import { deleteItem } from './operations/delete'
import { update } from './operations/update'
import { scan } from './operations/scan'

export const db = {
  get,
  put,
  query,
  deleteItem,
  update,
  scan,
}
