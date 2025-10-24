import { InsertAlertSchema } from './insert.schema'

/**
 * Schema for updating an existing alert
 * All fields are optional (partial update)
 * Cannot update alertId, timestamp, or createdAt
 */
export const UpdateAlertSchema = InsertAlertSchema.partial()
