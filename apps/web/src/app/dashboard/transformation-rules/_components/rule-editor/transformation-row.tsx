"use client";

import { useQuery } from "convex/react";
import { ChevronDown, Trash2 } from "lucide-react";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type { Id } from "@sizeupdashboard/convex/src/api/_generated/dataModel.js";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TransformationParams,
  type TransformationParamsForm,
} from "@/components/dashboard/transformation-params";
import type { TemplateField } from "@/components/ui/template-input";
import {
  FIELD_LABELS,
  FIELD_OPTIONS,
  getAvailableStrategies,
  STRATEGY_META,
  tintChipClasses,
  type FieldName,
  type TransformationStrategy,
} from "@/lib/transformations/fields";
import { cn } from "@/utils/ui";
import {
  DEFAULT_PARAMS,
  type InlineConfig,
  type RuleFormApi,
} from "./types";

// Fields the merge_data template autocomplete can reference.
const TEMPLATE_FIELDS: TemplateField[] = FIELD_OPTIONS.filter(
  (o) => o.value !== "location",
).map((o) => ({ key: o.value, label: o.label.replace(/\s*\(.*\)$/, "") }));

export interface LibrarySnapshot {
  field: string;
  strategy: string;
  params: Record<string, unknown>;
  name: string;
}

interface TransformationRowProps {
  form: RuleFormApi;
  index: number;
  config: InlineConfig;
  open: boolean;
  onToggle: () => void;
  onRemove: () => void;
  ruleId?: Id<"transformationRules">;
  snapshot?: LibrarySnapshot;
}

export function TransformationRow({
  form,
  index,
  config,
  open,
  onToggle,
  onRemove,
  ruleId,
  snapshot,
}: TransformationRowProps) {
  const usage = useQuery(
    api.transformations.getFieldTransformationUsage,
    config.libraryId ? { transformationId: config.libraryId } : "skip",
  );

  const updateConfig = (patch: Partial<InlineConfig>) =>
    form.setFieldValue(
      "transformations",
      (prev: InlineConfig[]) =>
        prev.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );

  const strategyMeta = config.strategy
    ? STRATEGY_META[config.strategy]
    : null;
  const StrategyIcon = strategyMeta?.icon;
  const fieldLabel = config.field
    ? (FIELD_LABELS[config.field] ?? config.field)
    : "Choose a field";

  const otherRules = (usage?.usedByRules ?? []).filter((r) => r.id !== ruleId);
  const differsFromLibrary = snapshot
    ? JSON.stringify({
        field: config.field,
        strategy: config.strategy,
        params: config.params,
        name: config.name,
      }) !==
      JSON.stringify({
        field: snapshot.field,
        strategy: snapshot.strategy,
        params: snapshot.params,
        name: snapshot.name,
      })
    : false;
  const showSharedWarning =
    Boolean(config.libraryId) && otherRules.length > 0 && differsFromLibrary;

  const availableStrategies = config.field
    ? getAvailableStrategies(config.field)
    : [];

  return (
    <div className="overflow-hidden rounded-md border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="bg-muted/60 hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        {strategyMeta && StrategyIcon ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              tintChipClasses(strategyMeta.tint),
            )}
          >
            <StrategyIcon className="size-3" />
            {strategyMeta.label}
          </span>
        ) : (
          <span className="text-muted-foreground rounded-full border px-2 py-0.5 text-xs font-semibold">
            Not configured
          </span>
        )}
        <span className="flex-1 truncate text-sm font-medium">
          {fieldLabel}
        </span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="grid gap-3 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-muted-foreground text-xs font-semibold">
                Field
              </label>
              <Select
                value={config.field || undefined}
                onValueChange={(v) => {
                  const nextField = v as FieldName;
                  const allowed = getAvailableStrategies(nextField);
                  const nextStrategy = allowed.some(
                    (s) => s.value === config.strategy,
                  )
                    ? config.strategy
                    : (allowed[0]?.value ?? "");
                  updateConfig({
                    field: nextField,
                    strategy: nextStrategy,
                    params: { ...DEFAULT_PARAMS },
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-muted-foreground text-xs font-semibold">
                What happens to it
              </label>
              <Select
                value={config.strategy || undefined}
                disabled={!config.field}
                onValueChange={(v) =>
                  updateConfig({
                    strategy: v as TransformationStrategy,
                    params: { ...DEFAULT_PARAMS },
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      config.field
                        ? "Select a strategy"
                        : "Select a field first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableStrategies.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {config.field && config.strategy ? (
            <TransformationParams
              form={form as unknown as TransformationParamsForm}
              basePath={`transformations[${index}].params`}
              strategy={config.strategy}
              field={config.field}
              fieldsForTemplate={TEMPLATE_FIELDS}
            />
          ) : null}

          {showSharedWarning ? (
            <div className="flex flex-col gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-300">
              <span>
                Also used by {otherRules.length} other rule
                {otherRules.length === 1 ? "" : "s"} — editing here changes those
                too.
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7"
                  onClick={() =>
                    updateConfig({
                      libraryId: undefined,
                      name: `${config.name} (copy)`,
                    })
                  }
                >
                  Detach as copy
                </Button>
                <span className="text-muted-foreground">
                  or keep editing for all rules
                </span>
              </div>
            </div>
          ) : null}

          <div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="mr-1 size-4" />
              Remove this transformation
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
