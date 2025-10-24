import z from 'zod'

/**
 * Generic success response
 */
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
})

/**
 * Generic error response
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.any(), z.any()).optional(),
})

/**
 * Health check response
 */
export const HealthCheckSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.number().int().positive(),
  version: z.string().optional(),
  services: z
    .record(
      z.any(),
      z.object({
        status: z.enum(['up', 'down']),
        message: z.string().optional(),
      })
    )
    .optional(),
})

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
export type HealthCheck = z.infer<typeof HealthCheckSchema>
