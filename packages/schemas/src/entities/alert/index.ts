/**
 * Alert Entity
 * Single source of truth for alert-related schemas and types
 */

// DB Schemas
export {
  AlertDbSchema,
  AlertSeveritySchema,
  AlertSourceSchema,
  AlertLocationSchema,
  AlertDataSchema,
} from './db.schema'

// Insert Schemas
export { InsertAlertSchema } from './insert.schema'

// Update Schemas
export { UpdateAlertSchema } from './update.schema'

// Types
export type {
  Alert,
  AlertSeverity,
  AlertSource,
  AlertLocation,
  AlertData,
  InsertAlert,
  UpdateAlert,
} from './types'
