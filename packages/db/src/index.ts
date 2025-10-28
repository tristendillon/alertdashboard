/**
 * @alertdashboard/db
 * Type-safe PostgreSQL database operations using Drizzle ORM
 */

/**
 * Export the Drizzle ORM instance and schema
 *
 * @example
 * import { db, alerts } from "@alertdashboard/db";
 * import { eq, desc } from "drizzle-orm";
 *
 * // Get an alert by ID
 * const alert = await db.select().from(alerts).where(eq(alerts.id, "123"));
 *
 * // Create a new alert
 * await db.insert(alerts).values({
 *   source: "firstdue",
 *   alertData: { ... }
 * });
 *
 * // Query alerts with filtering and sorting
 * const recentAlerts = await db
 *   .select()
 *   .from(alerts)
 *   .where(eq(alerts.source, "firstdue"))
 *   .orderBy(desc(alerts.timestamp))
 *   .limit(10);
 *
 * // Update an alert
 * await db
 *   .update(alerts)
 *   .set({ assignedTo: "user@example.com", updatedAt: new Date() })
 *   .where(eq(alerts.id, "123"));
 *
 * // Delete an alert
 * await db.delete(alerts).where(eq(alerts.id, "123"));
 */
export { db, alerts } from './client'
