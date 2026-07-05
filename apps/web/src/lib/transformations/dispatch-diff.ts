import type {
  DispatchWithType,
  TransformedDispatch,
} from "@sizeupdashboard/convex/src/api/schema.ts";

// Field-by-field diff between an original dispatch and its transformed form,
// used by the rule-editor "Changes" view. Only fields that changed or were
// removed are returned. `location` collapses to a single formatted entry.

export interface DispatchDiffEntry {
  key: string;
  label: string;
  before?: string;
  after?: string;
  removed: boolean;
}

interface DisplayField {
  key: string;
  label: string;
}

const DISPLAY_FIELDS: DisplayField[] = [
  { key: "type", label: "Type" },
  { key: "narrative", label: "Narrative" },
  { key: "address", label: "Address" },
  { key: "address2", label: "Address 2" },
  { key: "city", label: "City" },
  { key: "stateCode", label: "State" },
  { key: "location", label: "Location" },
  { key: "unitCodes", label: "Units" },
  { key: "dispatchId", label: "Dispatch ID" },
];

function formatValue(key: string, value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (key === "location") {
    const loc = value as { lat: number; lng: number };
    return `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
  }
  if (Array.isArray(value)) return value.join(" ");
  return String(value);
}

export function diffDispatch(
  original: DispatchWithType,
  transformed: TransformedDispatch,
): DispatchDiffEntry[] {
  const out: DispatchDiffEntry[] = [];
  const a = original as Record<string, unknown>;
  const b = transformed as Record<string, unknown>;

  for (const { key, label } of DISPLAY_FIELDS) {
    const before = formatValue(key, a[key]);
    const after = formatValue(key, b[key]);
    const removed = a[key] !== undefined && b[key] === undefined;

    if (removed) {
      out.push({ key, label, before, removed: true });
    } else if (before !== after) {
      out.push({ key, label, before, after, removed: false });
    }
  }
  return out;
}
