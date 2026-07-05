"use client";

import { useCallback } from "react";
import { useQuery } from "convex/react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type { DispatchWithType } from "@sizeupdashboard/convex/src/api/schema.ts";
import { SAMPLE_DISPATCH } from "@/lib/transformations/sample-dispatch";
import {
  FIELD_LABELS,
  fieldSchemas,
  type FieldName,
} from "@/lib/transformations/fields";
import { useDrawerState } from "@/hooks/nuqs/use-drawer-state";
import { DrawerEntity, DrawerMode } from "@/lib/enums";
import { cn } from "@/utils/ui";
import { AnnotatedDispatch } from "./annotated-dispatch";
import { FieldDetailPanel } from "./field-detail-panel";
import { configsForField } from "./transformation-example";

// Any field the anatomy/zones can select (chips are the top-level subset).
const FIELD_KEYS = Object.keys(fieldSchemas) as FieldName[];

// Top-level fields shown as chips + anatomy zones, in reading order. Excludes
// the location.* sub-fields (they roll up into "location").
const MATRIX_FIELDS: FieldName[] = [
  "type",
  "narrative",
  "address",
  "address2",
  "city",
  "stateCode",
  "location",
  "unitCodes",
];

const fieldParser = parseAsStringLiteral(FIELD_KEYS).withDefault("narrative");

export function FieldsOverview() {
  const [selectedField, setSelectedField] = useQueryState("fld", fieldParser);
  const [, setFieldParam] = useQueryState("field");
  const { open } = useDrawerState();

  const configs = useQuery(api.transformations.getFieldTransformations, {});
  const lastDispatch = useQuery(api.dispatches.getLastDispatchData);

  const onNewForField = useCallback(
    (field: FieldName) => {
      void setFieldParam(field);
      open(DrawerEntity.FIELD_TRANSFORMATION, DrawerMode.CREATE);
    },
    [setFieldParam, open],
  );

  // Configs load quickly; treat undefined as an empty library for counts.
  const resolvedConfigs = configs ?? [];
  const dispatch: DispatchWithType =
    (lastDispatch as DispatchWithType | null | undefined) ?? SAMPLE_DISPATCH;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1.5">
        {MATRIX_FIELDS.map((field) => {
          const count = configsForField(resolvedConfigs, field).length;
          const selected = selectedField === field;
          return (
            <button
              key={field}
              type="button"
              onClick={() => void setSelectedField(field)}
              aria-pressed={selected}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card hover:bg-muted",
              )}
            >
              {FIELD_LABELS[field]}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px]",
                  "bg-[color-mix(in_oklch,currentColor_18%,transparent)]",
                  count === 0 && !selected && "text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_3fr]">
        <AnnotatedDispatch
          dispatch={dispatch}
          configs={resolvedConfigs}
          selectedField={selectedField}
          onSelect={(field) => void setSelectedField(field)}
        />
        <FieldDetailPanel
          selectedField={selectedField}
          configs={resolvedConfigs}
          dispatch={dispatch}
          onNewForField={onNewForField}
        />
      </div>
    </div>
  );
}
