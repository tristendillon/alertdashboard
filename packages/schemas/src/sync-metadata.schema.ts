import { z } from "zod";

/**
 * Sync type enum
 */
export const SyncTypeSchema = z.enum(["firstdue", "active911"]);

export type SyncType = z.infer<typeof SyncTypeSchema>;

/**
 * Sync status enum
 */
export const SyncStatusSchema = z.enum([
  "started",
  "in_progress",
  "completed",
  "failed",
]);

export type SyncStatus = z.infer<typeof SyncStatusSchema>;

/**
 * Sync metadata schema
 * Tracks sync execution history and state
 */
export const SyncMetadataSchema = z.object({
  syncType: SyncTypeSchema,
  timestamp: z.number(),
  status: SyncStatusSchema,
  alertsProcessed: z.number().default(0),
  alertsCreated: z.number().default(0),
  alertsUpdated: z.number().default(0),
  errorCount: z.number().default(0),
  errorMessage: z.string().optional(),
  duration: z.number().optional(), // Duration in milliseconds
  lastAlertTimestamp: z.number().optional(), // Last alert timestamp processed
});

export type SyncMetadata = z.infer<typeof SyncMetadataSchema>;

/**
 * Schema for creating sync metadata
 */
export const CreateSyncMetadataSchema = SyncMetadataSchema.partial({
  alertsProcessed: true,
  alertsCreated: true,
  alertsUpdated: true,
  errorCount: true,
});

export type CreateSyncMetadata = z.infer<typeof CreateSyncMetadataSchema>;
