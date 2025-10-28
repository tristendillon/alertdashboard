import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  real,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export enum AlertSource {
  FIRST_DUE = 'firstdue',
  ACTIVE_911 = 'active911',
}

/**
 * Alerts table schema for PostgreSQL
 * Replaces the DynamoDB table structure with PostgreSQL equivalent
 */
export const alerts = pgTable(
  'alerts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    source: text('source', {
      enum: Object.values(AlertSource) as [string, ...string[]],
    }).notNull(),

    latitude: real('latitude').notNull(),
    longitude: real('longitude').notNull(),
    address: text('address').notNull(),
    address2: text('address2'),
    city: text('city').notNull(),
    state: text('state').notNull(),
    fullAddress: text('full_address').notNull(),

    units: text('units').array(),
    incidentType: text('incident_type').notNull(),

    dispatchId: text('dispatch_id').notNull(),
    externalId: text('external_id').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => {
    return [
      index('source_created_at_idx').on(table.source, table.createdAt),
      index('external_id_idx').on(table.externalId),
      index('dispatch_id_idx').on(table.dispatchId),
    ]
  }
)

export const SelectAlertSchema = createSelectSchema(alerts, {
  createdAt: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  updatedAt: z.union([z.date(), z.string().transform((str) => new Date(str))]),
})
export const InsertAlertSchema = createInsertSchema(alerts)
export const UpdateAlertSchema = InsertAlertSchema.omit({
  id: true,
  timestamp: true,
  createdAt: true,
}).partial()

export type Alert = z.infer<typeof SelectAlertSchema>
export type InsertAlert = z.infer<typeof InsertAlertSchema>
export type UpdateAlert = z.infer<typeof UpdateAlertSchema>
