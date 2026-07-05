"use client";

import {
  applyTransformationConfigs,
  createSeededRandom,
  getNestedValue,
} from "@sizeupdashboard/convex/src/lib/transform/core.ts";
import type {
  DispatchWithType,
  FieldTransformation,
  TransformedDispatch,
} from "@sizeupdashboard/convex/src/api/schema.ts";
import { cn } from "@/utils/ui";

// Fixed seed so worked examples are stable across renders/sessions.
const EXAMPLE_SEED = 42;

// A config targeting `location.lat`/`location.lng` still displays against the
// whole `location` object so the before/after reads as "lat, lng".
function displayKey(field: string): string {
  return field.startsWith("location.") ? "location" : field;
}

/** Configs that target a given field zone (location includes location.*). */
export function configsForField<T extends { field: string }>(
  configs: readonly T[],
  field: string,
): T[] {
  return configs.filter(
    (config) =>
      config.field === field ||
      (field === "location" && config.field.startsWith("location.")),
  );
}

/**
 * The dispatch's current value for a field, formatted for display. Returns
 * `undefined` when the field is absent so callers can render a placeholder.
 */
export function formatFieldValue(
  field: string,
  source: DispatchWithType | TransformedDispatch,
): string | undefined {
  const value = getNestedValue(source, displayKey(field));
  if (value === undefined || value === null) return undefined;
  if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    "lat" in value &&
    "lng" in value
  ) {
    return `${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}`;
  }
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function truncate(value: string, max = 44): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

interface TransformationExampleProps {
  config: FieldTransformation;
  dispatch: DispatchWithType;
}

/**
 * A live `before → after` example row for a single transformation config,
 * applied in isolation with a fixed seed. `remove_field` renders a red
 * "removed entirely" in place of an after value.
 */
export function TransformationExample({
  config,
  dispatch,
}: TransformationExampleProps) {
  const before = formatFieldValue(config.field, dispatch);
  const isRemove = config.strategy === "remove_field";

  let after: string | undefined;
  if (!isRemove) {
    const result = applyTransformationConfigs(dispatch, [config], {
      random: createSeededRandom(EXAMPLE_SEED),
    });
    after = formatFieldValue(config.field, result);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs">
      <span className="text-muted-foreground line-through opacity-70">
        {truncate(before ?? "—")}
      </span>
      <span className="text-muted-foreground">→</span>
      {isRemove ? (
        <span
          className={cn(
            "font-semibold",
            "text-[oklch(0.55_0.19_27)] dark:text-[oklch(0.68_0.19_27)]",
          )}
        >
          removed entirely
        </span>
      ) : (
        <span>{truncate(after ?? "—")}</span>
      )}
    </div>
  );
}
