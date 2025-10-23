import { z } from "zod";

/**
 * Active911 webhook event types
 * Based on Active911 API documentation
 */
export const Active911EventTypeSchema = z.enum([
  "alert",
  "response",
  "resource",
  "message",
]);

export type Active911EventType = z.infer<typeof Active911EventTypeSchema>;

/**
 * Active911 webhook payload schema
 * TODO: Update based on actual Active911 webhook structure
 */
export const Active911WebhookSchema = z.object({
  event: Active911EventTypeSchema,
  alert: z
    .object({
      id: z.string(),
      timestamp: z.number(),
      description: z.string(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      units: z.array(z.string()).optional(),
      details: z.record(z.unknown()).optional(),
    })
    .optional(),
  // Additional fields can be added as needed
  rawPayload: z.record(z.unknown()),
});

export type Active911Webhook = z.infer<typeof Active911WebhookSchema>;
