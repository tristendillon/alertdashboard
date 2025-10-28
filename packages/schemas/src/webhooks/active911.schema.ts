import z from 'zod'

export const Active911WebhookSchema = z.object({})

export type Active911Webhook = z.infer<typeof Active911WebhookSchema>
