import { AlertDbSchema } from './db.schema'

/**
 * Schema for inserting a new alert
 * Omits auto-generated fields: id, type, timestamp, createdAt
 * updatedAt is optional since it's not set on creation
 * type is auto-populated as 'alert'
 */
export const InsertAlertSchema = AlertDbSchema.omit({
  id: true,
  timestamp: true,
  createdAt: true,
  updatedAt: true,
})
