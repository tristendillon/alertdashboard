import { z } from "zod";

/**
 * Alert status enum
 */
export const AlertStatusSchema = z.enum([
  "new",
  "acknowledged",
  "in_progress",
  "resolved",
  "closed",
]);

export type AlertStatus = z.infer<typeof AlertStatusSchema>;

/**
 * Alert severity enum
 */
export const AlertSeveritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;

/**
 * Alert source (FirstDue or Active911)
 */
export const AlertSourceSchema = z.enum(["firstdue", "active911"]);

export type AlertSource = z.infer<typeof AlertSourceSchema>;

/**
 * Base alert data structure
 * Common fields for both FirstDue and Active911 alerts
 */
export const AlertDataSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  severity: AlertSeveritySchema,
  location: z
    .object({
      address: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
    })
    .optional(),
  units: z.array(z.string()).optional(),
  incidentType: z.string().optional(),
  rawData: z.record(z.unknown()), // Store original API response
});

export type AlertData = z.infer<typeof AlertDataSchema>;

/**
 * Complete alert schema for DynamoDB
 */
export const AlertSchema = z.object({
  alertId: z.string().uuid(),
  timestamp: z.number(),
  status: AlertStatusSchema,
  source: AlertSourceSchema,
  alertData: AlertDataSchema,
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  externalId: z.string().optional(), // ID from FirstDue or Active911
});

export type Alert = z.infer<typeof AlertSchema>;

/**
 * Schema for creating a new alert (without auto-generated fields)
 */
export const CreateAlertSchema = AlertSchema.omit({
  alertId: true,
  timestamp: true,
  createdAt: true,
});

export type CreateAlert = z.infer<typeof CreateAlertSchema>;
