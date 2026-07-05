"use client";

import { MapPin } from "lucide-react";
import type {
  DispatchWithType,
  FieldTransformation,
} from "@sizeupdashboard/convex/src/api/schema.ts";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/ui";
import type { FieldName } from "@/lib/transformations/fields";
import { configsForField } from "./transformation-example";

interface ZoneProps {
  field: FieldName;
  label: string;
  count: number;
  selected: boolean;
  onSelect: (field: FieldName) => void;
  className?: string;
  children: React.ReactNode;
}

function Zone({
  field,
  label,
  count,
  selected,
  onSelect,
  className,
  children,
}: ZoneProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(field)}
      aria-pressed={selected}
      className={cn(
        "relative w-full rounded-md border-[1.5px] border-dashed border-transparent px-2 py-1.5 text-left text-sm transition-colors",
        "hover:border-accent hover:bg-muted",
        selected &&
          "border-solid border-primary bg-[color-mix(in_oklch,var(--primary)_7%,transparent)]",
        className,
      )}
    >
      <span
        className={cn(
          "absolute -top-2 -right-1.5 z-[5] rounded-full px-1.5 py-px text-[10px] font-bold",
          count > 0
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {count > 0 ? `${count} transformation${count > 1 ? "s" : ""}` : "+"}
      </span>
      <span className="mb-0.5 block text-[9.5px] font-medium tracking-[0.07em] text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </button>
  );
}

interface AnnotatedDispatchProps {
  dispatch: DispatchWithType;
  configs: FieldTransformation[];
  selectedField: FieldName;
  onSelect: (field: FieldName) => void;
}

/**
 * A card-lookalike of one real dispatch whose parts are clickable zones. Each
 * zone selects the field it represents; the corner badge counts how many
 * transformations target that field (location.* counts toward "location").
 */
export function AnnotatedDispatch({
  dispatch,
  configs,
  selectedField,
  onSelect,
}: AnnotatedDispatchProps) {
  const count = (field: string) => configsForField(configs, field).length;
  const zoneProps = (field: FieldName) => ({
    field,
    count: count(field),
    selected: selectedField === field,
    onSelect,
  });

  const units = dispatch.unitCodes ?? [];

  return (
    <Card className="gap-2 p-4">
      <p className="mb-1 text-xs text-muted-foreground">
        A recent dispatch, annotated. Click any part to see how it can be
        transformed.
      </p>

      <div className="flex gap-2">
        <Zone {...zoneProps("type")} label="type" className="flex-1">
          <span className="font-bold">{dispatch.type}</span>
        </Zone>
        <Zone {...zoneProps("dispatchId")} label="dispatch id" className="flex-1">
          <span className="font-mono text-xs">#{dispatch.dispatchId}</span>
        </Zone>
      </div>

      <Zone {...zoneProps("narrative")} label="narrative">
        <span className="line-clamp-3 font-mono text-[11.5px] whitespace-pre-wrap">
          {dispatch.narrative ?? "—"}
        </span>
      </Zone>

      <div className="flex gap-2">
        <Zone {...zoneProps("address")} label="address" className="flex-1">
          {dispatch.address}
        </Zone>
        <Zone {...zoneProps("address2")} label="address 2" className="flex-1">
          {dispatch.address2 ?? "—"}
        </Zone>
      </div>

      <div className="flex gap-2">
        <Zone {...zoneProps("city")} label="city" className="flex-1">
          {dispatch.city ?? "—"}
        </Zone>
        <Zone {...zoneProps("stateCode")} label="state" className="flex-1">
          {dispatch.stateCode ?? "—"}
        </Zone>
      </div>

      <Zone {...zoneProps("unitCodes")} label="units">
        <span className="flex flex-wrap gap-1">
          {units.length > 0 ? (
            units.map((unit, index) => (
              <span
                key={`${unit}-${index}`}
                className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold"
              >
                {unit}
              </span>
            ))
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </span>
      </Zone>

      <Zone {...zoneProps("location")} label="location — the map pin">
        <div
          className="relative mt-1 h-[90px] overflow-hidden rounded-md border bg-muted"
          style={{
            backgroundImage:
              "repeating-linear-gradient(var(--border) 0 1px, transparent 1px 26px), repeating-linear-gradient(90deg, var(--border) 0 1px, transparent 1px 26px)",
          }}
        >
          <MapPin
            className="absolute size-6 text-primary"
            style={{ left: "46%", top: "44%", transform: "translate(-50%, -92%)" }}
            fill="currentColor"
            stroke="none"
          />
        </div>
      </Zone>
    </Card>
  );
}
