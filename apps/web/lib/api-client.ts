import { hc } from "hono/client";
import type { AppType } from "@alertdashboard/api/src/index";

/**
 * Create a type-safe Hono API client
 * Automatically infers request/response types from backend
 *
 * @param apiUrl - The API base URL (from SST Resource)
 * @returns Type-safe API client
 *
 * @example
 * const client = createApiClient("https://api.alertdashboard.com");
 * const res = await client.v1.alerts.$get();
 */
export function createApiClient(apiUrl: string) {
  return hc<AppType>(apiUrl);
}
