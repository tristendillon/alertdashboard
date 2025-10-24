import { z } from 'zod'
import {
  AlertDbSchema,
  AlertSeveritySchema,
  AlertSourceSchema,
  AlertLocationSchema,
  AlertDataSchema,
} from './db.schema'
import { InsertAlertSchema } from './insert.schema'
import { UpdateAlertSchema } from './update.schema'

/**
 * TypeScript types inferred from Zod schemas
 */

// DB Types
export type Alert = z.infer<typeof AlertDbSchema>
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>
export type AlertSource = z.infer<typeof AlertSourceSchema>
export type AlertLocation = z.infer<typeof AlertLocationSchema>
export type AlertData = z.infer<typeof AlertDataSchema>

// Insert Types
export type InsertAlert = z.infer<typeof InsertAlertSchema>

// Update Types
export type UpdateAlert = z.infer<typeof UpdateAlertSchema>
