import { z } from "zod";

/**
 * Pagination query parameters
 * Used for listing endpoints
 */
export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  lastKey: z.string().optional(), // DynamoDB pagination key (encoded)
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Pagination metadata returned in responses
 */
export const PaginationMetaSchema = z.object({
  limit: z.number(),
  hasMore: z.boolean(),
  lastKey: z.string().optional(), // Next page key
  totalCount: z.number().optional(), // Optional total count
});

/**
 * Generic paginated response wrapper
 */
export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) => {
  return z.object({
    items: z.array(itemSchema),
    pagination: PaginationMetaSchema,
  });
};

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
