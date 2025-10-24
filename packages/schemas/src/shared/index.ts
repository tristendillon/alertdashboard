/**
 * Shared Schemas
 * Common schemas used across the application
 */

// Pagination
export {
  PaginationQuerySchema,
  PaginationMetaSchema,
  createPaginatedResponseSchema,
} from './pagination.schema'
export type { PaginationQuery, PaginationMeta } from './pagination.schema'

// Common utilities
export {
  SuccessResponseSchema,
  ErrorResponseSchema,
  HealthCheckSchema,
} from './common.schema'
export type {
  SuccessResponse,
  ErrorResponse,
  HealthCheck,
} from './common.schema'
