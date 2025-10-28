/**
 * Alert Entity
 * Single source of truth for alert-related schemas and types
 * Using Drizzle ORM for PostgreSQL
 */

// Drizzle table schema
export { alerts } from './drizzle.schema'

// Zod validation schemas
export {
  SelectAlertSchema,
  InsertAlertSchema,
  UpdateAlertSchema,
} from './drizzle.schema'

// Types
export { AlertSource } from './drizzle.schema'
export type { Alert, InsertAlert, UpdateAlert } from './drizzle.schema'
