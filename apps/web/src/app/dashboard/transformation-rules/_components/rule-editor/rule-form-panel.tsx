"use client";

import { useMemo, useRef, useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { Plus } from "lucide-react";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type { Id } from "@sizeupdashboard/convex/src/api/_generated/dataModel.js";
import type { DispatchWithType } from "@sizeupdashboard/convex/src/api/schema.ts";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  MultiCombobox,
  type MultiComboboxOption,
} from "@/components/ui/multi-combobox";
import { OverflowChips } from "@/components/ui/overflow-chips";
import { compileSafeRegex, matchSpan } from "@/lib/transformations/safe-regex";
import { cn } from "@/utils/ui";
import { TransformationRow, type LibrarySnapshot } from "./transformation-row";
import { useDebouncedValue } from "./use-debounced-value";
import {
  DEFAULT_PARAMS,
  uid,
  type InlineConfig,
  type RuleEditorFormValues,
  type RuleFormApi,
} from "./types";

type DispatchTypeDoc = FunctionReturnType<
  typeof api.dispatches.getDispatchTypes
>[number];

interface RuleFormPanelProps {
  form: RuleFormApi;
  ruleId?: Id<"transformationRules">;
  dispatchTypes: DispatchTypeDoc[] | undefined;
  recentDispatches: DispatchWithType[];
}

export function RuleFormPanel({
  form,
  ruleId,
  dispatchTypes,
  recentDispatches,
}: RuleFormPanelProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  // Snapshot the library-backed configs at mount to detect local edits.
  const snapshotsRef = useRef<Record<string, LibrarySnapshot> | null>(null);
  if (snapshotsRef.current === null) {
    const map: Record<string, LibrarySnapshot> = {};
    const initial = (form.store.state as { values: RuleEditorFormValues })
      .values.transformations;
    for (const c of initial) {
      if (c.libraryId) {
        map[c.libraryId] = {
          field: c.field,
          strategy: c.strategy,
          params: c.params,
          name: c.name,
        };
      }
    }
    snapshotsRef.current = map;
  }

  const typeOptions = useMemo<MultiComboboxOption[]>(
    () =>
      (dispatchTypes ?? []).map((dt) => ({
        value: dt._id,
        label: dt.name ?? dt.code,
        hint: dt.code,
      })),
    [dispatchTypes],
  );

  // Corpus for regex feedback: all dispatch-type strings ∪ recent type strings.
  const corpus = useMemo(() => {
    const set = new Set<string>();
    for (const dt of dispatchTypes ?? []) {
      if (dt.code) set.add(dt.code);
      if (dt.name) set.add(dt.name);
    }
    for (const d of recentDispatches) {
      if (d.type) set.add(d.type);
    }
    return Array.from(set).map((s) => s.slice(0, 300));
  }, [dispatchTypes, recentDispatches]);

  const addTransformation = () => {
    const key = uid();
    form.setFieldValue("transformations", (prev: InlineConfig[]) => [
      ...prev,
      {
        key,
        name: "New transformation",
        field: "narrative",
        strategy: "static_value",
        params: { ...DEFAULT_PARAMS, value: "Details withheld." },
      },
    ]);
    setOpenKey(key);
  };

  const removeTransformation = (index: number, key: string) => {
    form.setFieldValue("transformations", (prev: InlineConfig[]) =>
      prev.filter((_, i) => i !== index),
    );
    if (openKey === key) setOpenKey(null);
  };

  return (
    <Card className="flex flex-col gap-4 p-4">
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) =>
            !String(value ?? "").trim() ? "Rule name is required" : undefined,
        }}
      >
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>Rule name</Label>
            <Input
              id={field.name}
              placeholder="e.g. Medical privacy"
              value={field.state.value as string}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="enabled">
        {(field) => {
          const enabled = field.state.value as boolean;
          return (
            <div className="flex items-center gap-3">
              <Switch
                id={field.name}
                checked={enabled}
                onCheckedChange={(c) => field.handleChange(c)}
              />
              <span className="text-sm">
                {enabled
                  ? "Enabled — applies to public viewers"
                  : "Disabled — saved but not applied"}
              </span>
            </div>
          );
        }}
      </form.Field>

      <SectionHeading>When does this rule apply?</SectionHeading>

      <form.Field name="dispatchTypeRegex">
        {(field) => (
          <RegexField
            value={field.state.value as string}
            onChange={(v) => field.handleChange(v)}
            onBlur={field.handleBlur}
            name={field.name}
            corpus={corpus}
          />
        )}
      </form.Field>

      <form.Field name="keywords">
        {(field) => (
          <KeywordInput
            keywords={field.state.value as string[]}
            onChange={(next) => field.handleChange(next)}
          />
        )}
      </form.Field>

      <form.Field name="dispatchTypes">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>Or the dispatch type is exactly</Label>
            <MultiCombobox
              id={field.name}
              options={typeOptions}
              selected={field.state.value as string[]}
              onChange={(next) => field.handleChange(next)}
              placeholder="Search dispatch types…"
            />
          </div>
        )}
      </form.Field>

      <SectionHeading>What gets changed</SectionHeading>

      <form.Subscribe selector={(s) => s.values.transformations}>
        {(configs) => (
          <div className="flex flex-col gap-2">
            {configs.length === 0 ? (
              <p className="text-muted-foreground bg-muted rounded-md p-2.5 text-xs">
                No transformations yet — this rule matches dispatches but changes
                nothing.
              </p>
            ) : (
              configs.map((config, index) => (
                <TransformationRow
                  key={config.key}
                  form={form}
                  index={index}
                  config={config}
                  open={openKey === config.key}
                  onToggle={() =>
                    setOpenKey((prev) =>
                      prev === config.key ? null : config.key,
                    )
                  }
                  onRemove={() => removeTransformation(index, config.key)}
                  ruleId={ruleId}
                  snapshot={
                    config.libraryId
                      ? snapshotsRef.current?.[config.libraryId]
                      : undefined
                  }
                />
              ))
            )}
          </div>
        )}
      </form.Subscribe>

      <div>
        <Button type="button" variant="outline" size="sm" onClick={addTransformation}>
          <Plus className="mr-1 size-4" />
          Add a transformation
        </Button>
      </div>
    </Card>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
      {children}
    </h3>
  );
}

interface RegexFieldProps {
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  name: string;
  corpus: string[];
}

function RegexField({ value, onChange, onBlur, name, corpus }: RegexFieldProps) {
  const [expanded, setExpanded] = useState(false);
  const debounced = useDebouncedValue(value, 250);

  const liveError = compileSafeRegex(value).error;

  const feedback = useMemo(() => {
    if (!debounced) return null;
    const { regex, error } = compileSafeRegex(debounced);
    if (error || !regex) return { error };
    const rows = corpus.map((text) => {
      const span = matchSpan(regex, text);
      return { text, span };
    });
    rows.sort((a, b) => (b.span ? 1 : 0) - (a.span ? 1 : 0));
    const matched = rows.filter((r) => r.span).length;
    return { rows, matched, total: corpus.length };
  }, [debounced, corpus]);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>Dispatch type pattern (regex)</Label>
      <Input
        id={name}
        spellCheck={false}
        placeholder="^med|ems"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={cn("font-mono", liveError && "border-destructive")}
      />
      {feedback?.error ? (
        <p className="text-destructive text-xs">
          Invalid pattern — {feedback.error}
        </p>
      ) : feedback && feedback.rows ? (
        <div className="text-muted-foreground text-xs">
          <div className="flex items-center gap-2">
            <span>
              <span className="text-foreground font-semibold">
                {feedback.matched}
              </span>{" "}
              of {feedback.total} type strings match
            </span>
            {feedback.total > 0 ? (
              <button
                type="button"
                className="text-primary underline"
                onClick={() => setExpanded((e) => !e)}
              >
                {expanded ? "hide" : "show"}
              </button>
            ) : null}
          </div>
          {expanded ? (
            <div className="mt-1.5 max-h-48 overflow-y-auto rounded-md border">
              {feedback.rows.map((row, i) => (
                <div
                  key={`${row.text}-${i}`}
                  className={cn(
                    "border-t px-2.5 py-1.5 font-mono text-xs first:border-t-0",
                    !row.span && "text-muted-foreground",
                  )}
                >
                  <span className="mr-2">{row.span ? "✓" : "·"}</span>
                  {row.span && row.span.end > row.span.start ? (
                    <span>
                      {row.text.slice(0, row.span.start)}
                      <mark className="bg-primary/30 rounded-sm px-0.5 text-inherit">
                        {row.text.slice(row.span.start, row.span.end)}
                      </mark>
                      {row.text.slice(row.span.end)}
                    </span>
                  ) : (
                    <span>{row.text}</span>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

interface KeywordInputProps {
  keywords: string[];
  onChange: (next: string[]) => void;
}

function KeywordInput({ keywords, onChange }: KeywordInputProps) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const k = draft.trim();
    if (!k) return;
    if (!keywords.includes(k)) onChange([...keywords, k]);
    setDraft("");
  };

  return (
    <div className="space-y-1.5">
      <Label>Or the type contains any of these words</Label>
      <div className="border-input flex flex-wrap items-center gap-1 rounded-md border p-1.5">
        {keywords.length > 0 ? (
          <OverflowChips
            items={keywords.map((k) => ({ key: k, label: k }))}
            max={3}
            onRemove={(key) => onChange(keywords.filter((k) => k !== key))}
          />
        ) : null}
        <input
          className="min-w-[100px] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
          placeholder="type a word, press Enter"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            } else if (e.key === "Backspace" && !draft && keywords.length) {
              onChange(keywords.slice(0, -1));
            }
          }}
        />
      </div>
    </div>
  );
}
