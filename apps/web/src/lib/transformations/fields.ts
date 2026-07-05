import { z } from "zod";
import {
  EyeOff,
  Merge,
  Move,
  Shuffle,
  Type,
  type LucideIcon,
} from "lucide-react";

// Single source of truth for the dispatch fields a transformation can target,
// their value shapes, the strategies each field allows, and the plain-language
// copy used across the transformation UI. The field form imports everything
// from here (do not re-declare these inside components).

export type TransformationStrategy =
  | "static_value"
  | "random_offset"
  | "random_string"
  | "merge_data"
  | "remove_field";

// Value shape per targetable field. `location` is the whole map pin (object);
// `location.lat` / `location.lng` address its numeric components.
export const fieldSchemas = {
  address: z.string(),
  address2: z.string(),
  city: z.string(),
  stateCode: z.string(),
  narrative: z.string(),
  location: z.object({ lat: z.number(), lng: z.number() }),
  "location.lat": z.number(),
  "location.lng": z.number(),
  unitCodes: z.array(z.string()),
  type: z.string(),
  dispatchId: z.string(),
} as const;

export type FieldName = keyof typeof fieldSchemas;

export type FieldKind = "string" | "number" | "array" | "object";

interface FieldOption {
  value: FieldName;
  label: string;
}

// Order drives the field <Select>. Mirrors today's list with `location` added.
export const FIELD_OPTIONS: FieldOption[] = [
  { value: "address", label: "Address (string)" },
  { value: "address2", label: "Address 2 (string)" },
  { value: "city", label: "City (string)" },
  { value: "stateCode", label: "State (string)" },
  { value: "narrative", label: "Narrative (string)" },
  { value: "location", label: "Location (map pin)" },
  { value: "location.lat", label: "Latitude (number)" },
  { value: "location.lng", label: "Longitude (number)" },
  { value: "unitCodes", label: "Units (array)" },
  { value: "type", label: "Type (string)" },
  { value: "dispatchId", label: "Dispatch ID (string)" },
];

// Human-readable label per field key (used by describeEffect + params copy).
export const FIELD_LABELS: Record<FieldName, string> = {
  address: "Address",
  address2: "Address 2",
  city: "City",
  stateCode: "State",
  narrative: "Narrative",
  location: "Location",
  "location.lat": "Latitude",
  "location.lng": "Longitude",
  unitCodes: "Units",
  type: "Type",
  dispatchId: "Dispatch ID",
};

// Fields that may be removed entirely for public viewers. Mirrors the backend
// core's REMOVABLE_FIELDS; a later pass may unify the import. `xrefId` has no
// editor field option today but is kept here to match the backend list.
export const REMOVABLE_FIELDS = [
  "location",
  "address",
  "address2",
  "city",
  "stateCode",
  "narrative",
  "unitCodes",
  "xrefId",
] as const;

export function getFieldType(fieldName: FieldName): FieldKind {
  const schema = fieldSchemas[fieldName];
  if (schema instanceof z.ZodString) return "string";
  if (schema instanceof z.ZodNumber) return "number";
  if (schema instanceof z.ZodArray) return "array";
  if (schema instanceof z.ZodObject) return "object";
  return "string";
}

export interface StrategyOption {
  value: TransformationStrategy;
  label: string;
  description: string;
}

// Canonical order. Filtering preserves this order so the strategy <Select>
// always lists in the same sequence.
export const STRATEGY_OPTIONS: StrategyOption[] = [
  {
    value: "static_value",
    label: "Static Value",
    description: "Replace field with a fixed value (redaction)",
  },
  {
    value: "random_offset",
    label: "Random Offset",
    description: "Add random offset to numeric values",
  },
  {
    value: "random_string",
    label: "Random String",
    description: "Generate random string replacement",
  },
  {
    value: "merge_data",
    label: "Merge Data",
    description: "Combine data from other fields",
  },
  {
    value: "remove_field",
    label: "Remove Field",
    description: "Remove the field entirely for public viewers",
  },
];

/**
 * Strategies allowed for a given field. Preserves today's gating and adds
 * removal:
 *  - object (location) → remove only
 *  - number            → static_value + random_offset
 *  - string            → static_value + random_string + merge_data
 *  - array (unitCodes) → static_value
 *  - + remove_field for any field in REMOVABLE_FIELDS
 */
export function getAvailableStrategies(field: FieldName): StrategyOption[] {
  const type = getFieldType(field);
  const allowed = new Set<TransformationStrategy>();
  if (type === "number") {
    allowed.add("static_value");
    allowed.add("random_offset");
  } else if (type === "string") {
    allowed.add("static_value");
    allowed.add("random_string");
    allowed.add("merge_data");
  } else if (type === "array") {
    allowed.add("static_value");
  }
  if ((REMOVABLE_FIELDS as readonly string[]).includes(field)) {
    allowed.add("remove_field");
  }
  return STRATEGY_OPTIONS.filter((s) => allowed.has(s.value));
}

// Static-value input validation, keyed off the target field's value shape.
export function validateStaticValue(
  value: string,
  fieldName: FieldName,
): string | undefined {
  const fieldType = getFieldType(fieldName);
  switch (fieldType) {
    case "number":
      if (isNaN(Number(value))) return "Value must be a valid number";
      break;
    case "array":
      try {
        JSON.parse(value);
      } catch {
        return "Value must be a valid JSON array";
      }
      break;
  }
  return undefined;
}

export type StrategyTint = "remove" | "static" | "offset" | "random";

export interface StrategyMeta {
  label: string;
  icon: LucideIcon;
  tint: StrategyTint;
}

export const STRATEGY_META: Record<TransformationStrategy, StrategyMeta> = {
  remove_field: { label: "Remove entirely", icon: EyeOff, tint: "remove" },
  static_value: {
    label: "Replace with fixed value",
    icon: Type,
    tint: "static",
  },
  random_offset: { label: "Random offset", icon: Move, tint: "offset" },
  random_string: { label: "Random string", icon: Shuffle, tint: "random" },
  merge_data: { label: "Build from other fields", icon: Merge, tint: "random" },
};

// Self-contained, theme-safe chip classes per tint. Values mirror the mock's
// --tint-* tokens (light + dark) via arbitrary oklch utilities so no extra CSS
// variables are required in globals.css.
const TINT_CLASSES: Record<StrategyTint, string> = {
  remove:
    "text-[oklch(0.55_0.19_27)] bg-[color-mix(in_oklch,oklch(0.55_0.19_27)_14%,transparent)] dark:text-[oklch(0.68_0.19_27)] dark:bg-[color-mix(in_oklch,oklch(0.68_0.19_27)_14%,transparent)]",
  static:
    "text-[oklch(0.68_0.14_75)] bg-[color-mix(in_oklch,oklch(0.68_0.14_75)_16%,transparent)] dark:text-[oklch(0.8_0.14_80)] dark:bg-[color-mix(in_oklch,oklch(0.8_0.14_80)_16%,transparent)]",
  offset:
    "text-[oklch(0.55_0.14_250)] bg-[color-mix(in_oklch,oklch(0.55_0.14_250)_14%,transparent)] dark:text-[oklch(0.72_0.13_250)] dark:bg-[color-mix(in_oklch,oklch(0.72_0.13_250)_14%,transparent)]",
  random:
    "text-[oklch(0.55_0.16_300)] bg-[color-mix(in_oklch,oklch(0.55_0.16_300)_14%,transparent)] dark:text-[oklch(0.72_0.15_300)] dark:bg-[color-mix(in_oklch,oklch(0.72_0.15_300)_14%,transparent)]",
};

/** Tailwind classes (bg + text, dark-mode-safe) for a strategy tint chip. */
export function tintChipClasses(tint: StrategyTint): string {
  return TINT_CLASSES[tint];
}

// The shape describeEffect consumes: a field transformation config.
export interface EffectConfig {
  field: string;
  strategy: TransformationStrategy;
  params?: Record<string, unknown> | null;
}

function labelFor(field: string): string {
  return (FIELD_LABELS[field as FieldName] ?? field).toLowerCase();
}

function truncate(value: string, max = 28): string {
  return value.length > max ? value.slice(0, max) : value;
}

/**
 * A plain-language fragment describing what a transformation does, e.g.
 * `replace narrative with "Details withheld"` or
 * `offset the map pin by up to ~200 m`.
 */
export function describeEffect(config: EffectConfig): string {
  const { field, strategy, params } = config;
  const label = labelFor(field);
  switch (strategy) {
    case "remove_field":
      return field === "location" ? "remove from the map" : `hide ${label}`;
    case "static_value":
      return `replace ${label} with "${truncate(String(params?.value ?? ""))}"`;
    case "random_offset": {
      if (field.startsWith("location.")) {
        const maxOffset = Number(params?.maxOffset ?? 0);
        const meters = Math.round(Math.abs(maxOffset) * 111000);
        return `offset the map pin by up to ~${meters} m`;
      }
      return `offset ${label}`;
    }
    case "random_string":
      return `scramble ${label}`;
    case "merge_data":
      return `rewrite ${label} as "${String(params?.template ?? "")}"`;
    default:
      return label;
  }
}
