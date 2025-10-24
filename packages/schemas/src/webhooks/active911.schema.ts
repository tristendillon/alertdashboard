import z from 'zod'

/**
 * Active911 webhook payload schema
 * TODO: Update based on actual Active911 webhook structure
 */
export const Active911WebhookSchema = z.object({
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
      details: z.record(z.any(), z.any()).optional(),
    })
    .optional(),
  // Additional fields can be added as needed
  rawPayload: z.record(z.any(), z.any()),
})

export type Active911Webhook = z.infer<typeof Active911WebhookSchema>
