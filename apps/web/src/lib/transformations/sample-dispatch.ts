import type { DispatchWithType } from "@sizeupdashboard/convex/src/api/schema.ts";

// A single canned dispatch used as a fallback when the database is empty and as
// the worked example in the field library. Uses a fixed epoch (never
// Date.now()) so previews stay deterministic across renders and sessions.

const FIXED_EPOCH = 1_735_732_800_000; // 2025-01-01T12:00:00Z

export const SAMPLE_DISPATCH: DispatchWithType = {
  _id: "sample_dispatch" as DispatchWithType["_id"],
  _creationTime: FIXED_EPOCH,
  dispatchId: 240071,
  type: "STRUCTURE FIRE",
  narrative:
    "SMOKE SHOWING FROM SECOND STORY WINDOW. OCCUPANTS EVACUATING. FIRE ALARM SOUNDING.",
  address: "412 W BIRCH ST",
  address2: "APT 3",
  city: "LUNAR HUE",
  stateCode: "WA",
  location: { lat: 47.6621, lng: -117.403 },
  unitCodes: ["E1", "L2", "BC1", "M41", "E7"],
  dispatchGroup: "fire",
  group: "fire",
  dispatchCreatedAt: FIXED_EPOCH,
};
