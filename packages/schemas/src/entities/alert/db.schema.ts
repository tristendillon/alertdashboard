import z from 'zod'

/**
 * Alert severity enum
 */
export const AlertSeveritySchema = z.enum(['low', 'medium', 'high', 'critical'])

/**
 * Alert source (FirstDue or Active911)
 */
export const AlertSourceSchema = z.enum(['firstdue', 'active911'])

/**
 * Alert location schema
 */
export const AlertLocationSchema = z.object({
  address: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
})

/**
 * Alert data structure
 * Common fields for both FirstDue and Active911 alerts
 */
export const AlertDataSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  severity: AlertSeveritySchema,
  location: AlertLocationSchema.optional(),
  units: z.array(z.string()).optional(),
  incidentType: z.string().optional(),
  rawData: z.record(z.any(), z.any()), // Store original API response
})

/**
 * Complete alert schema for DynamoDB
 * This is the source of truth for the Alert entity
 */
export const AlertDbSchema = z.object({
  id: z.uuid(),
  type: z.literal('alert').default('alert'), // Entity type for GSI querying
  timestamp: z.number().int().positive(),
  source: AlertSourceSchema,
  alertData: AlertDataSchema,
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  externalId: z.string().optional(), // ID from FirstDue or Active911
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive().optional(),
})
