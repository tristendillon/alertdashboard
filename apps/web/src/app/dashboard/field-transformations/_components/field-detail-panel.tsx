"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type {
  DispatchWithType,
  FieldTransformation,
} from "@sizeupdashboard/convex/src/api/schema.ts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils/ui";
import { useDrawerState } from "@/hooks/nuqs/use-drawer-state";
import { DrawerEntity, DrawerMode } from "@/lib/enums";
import {
  FIELD_LABELS,
  getFieldType,
  REMOVABLE_FIELDS,
  STRATEGY_META,
  tintChipClasses,
  type FieldName,
} from "@/lib/transformations/fields";
import { configsForField, TransformationExample } from "./transformation-example";

function isRemovable(field: FieldName): boolean {
  return (REMOVABLE_FIELDS as readonly string[]).includes(field);
}

interface FieldTransformationCardProps {
  config: FieldTransformation;
  dispatch: DispatchWithType;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function FieldTransformationCard({
  config,
  dispatch,
  onEdit,
  onDelete,
}: FieldTransformationCardProps) {
  const usage = useQuery(api.transformations.getFieldTransformationUsage, {
    transformationId: config._id,
  });
  const meta = STRATEGY_META[config.strategy];
  const Icon = meta.icon;
  const rules = usage?.usedByRules ?? [];
  const usageCount = usage?.usageCount ?? 0;
  const inUse = usageCount > 0;

  return (
    <div className="group relative flex flex-col gap-2 rounded-md border p-3">
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className={cn("border-transparent", tintChipClasses(meta.tint))}
        >
          <Icon className="size-3" />
          {meta.label}
        </Badge>
        <span className="flex-1 text-sm font-semibold">{config.name}</span>
        <span className="flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                onClick={() => onEdit(config._id)}
                aria-label="Edit transformation"
              >
                <Pencil className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-[oklch(0.55_0.19_27)] hover:text-[oklch(0.55_0.19_27)] dark:text-[oklch(0.68_0.19_27)] dark:hover:text-[oklch(0.68_0.19_27)]"
                onClick={() => onDelete(config._id)}
                aria-label="Delete transformation"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {inUse
                ? `In use by ${usageCount} rule${usageCount === 1 ? "" : "s"} — remove from rules first`
                : "Delete"}
            </TooltipContent>
          </Tooltip>
        </span>
      </div>

      <TransformationExample config={config} dispatch={dispatch} />

      <p className="text-[11.5px] text-muted-foreground">
        Used by <b className="text-foreground">{usageCount}</b> rule
        {usageCount === 1 ? "" : "s"}
        {rules.length > 0 ? ": " : ""}
        {rules.map((rule, index) => (
          <span key={rule.id}>
            {index > 0 ? ", " : ""}
            <Link
              href={`/dashboard/transformation-rules/${rule.id}`}
              className="text-accent-foreground underline underline-offset-2 hover:text-foreground"
            >
              {rule.name}
            </Link>
          </span>
        ))}
      </p>
    </div>
  );
}

interface FieldDetailPanelProps {
  selectedField: FieldName;
  configs: FieldTransformation[];
  dispatch: DispatchWithType;
  onNewForField: (field: FieldName) => void;
}

/**
 * The right-hand detail column: header for the selected field plus one card per
 * transformation targeting it, or a dashed empty state that seeds a CREATE.
 */
export function FieldDetailPanel({
  selectedField,
  configs,
  dispatch,
  onNewForField,
}: FieldDetailPanelProps) {
  const { open } = useDrawerState();
  const fieldConfigs = configsForField(configs, selectedField);
  const label = FIELD_LABELS[selectedField] ?? selectedField;
  const kind = getFieldType(selectedField);
  const removable = isRemovable(selectedField);

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center gap-2">
        <h3 className="flex-1 text-[15px] font-semibold">{label}</h3>
        <Badge variant="outline" className="text-muted-foreground">
          {kind}
        </Badge>
        {removable ? (
          <Badge
            variant="secondary"
            className={cn(
              "border-transparent",
              "text-[oklch(0.55_0.19_27)] dark:text-[oklch(0.68_0.19_27)]",
              "bg-[color-mix(in_oklch,oklch(0.55_0.19_27)_14%,transparent)] dark:bg-[color-mix(in_oklch,oklch(0.68_0.19_27)_14%,transparent)]",
            )}
          >
            <EyeOff className="size-3" />
            can be removed
          </Badge>
        ) : null}
      </div>

      {fieldConfigs.length > 0 ? (
        <div className="flex flex-col gap-3">
          {fieldConfigs.map((config) => (
            <FieldTransformationCard
              key={config._id}
              config={config}
              dispatch={dispatch}
              onEdit={(id) =>
                open(DrawerEntity.FIELD_TRANSFORMATION, DrawerMode.EDIT, id)
              }
              onDelete={(id) =>
                open(DrawerEntity.FIELD_TRANSFORMATION, DrawerMode.DELETE, id)
              }
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-md border-[1.5px] border-dashed p-6 text-center text-sm text-muted-foreground">
          <span>
            Nothing transforms <b>{label.toLowerCase()}</b> yet.
          </span>
          <Button size="sm" onClick={() => onNewForField(selectedField)}>
            <Plus className="size-4" />
            New transformation for this field
          </Button>
        </div>
      )}
    </Card>
  );
}
