import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Read-only, build-time prerender cache served from the static assets bundle.
// No R2/KV/queues — Convex owns all runtime data, so every other override is a no-op.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
