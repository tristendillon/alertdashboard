import type { DispatchGroupEnum } from "@sizeupdashboard/convex/src/api/schema.js";

// The convex package ships TypeScript sources, so its zod enum can only be
// imported as a type; `satisfies` keeps this list in sync with the backend.
export const DISPATCH_GROUPS = [
  "aircraft",
  "fire",
  "hazmat",
  "mva",
  "marine",
  "law",
  "rescue",
  "medical",
  "other",
] as const satisfies readonly DispatchGroupEnum[];
