"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Lock, Search, Shuffle, Unlock, X } from "lucide-react";
import {
  applyTransformationConfigs,
  createSeededRandom,
  hashStringToSeed,
  ruleMatchesDispatch,
  type FieldTransformationConfig,
  type RuleCriteria,
} from "@sizeupdashboard/convex/src/lib/transform/core.ts";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type { Id } from "@sizeupdashboard/convex/src/api/_generated/dataModel.js";
import type {
  DispatchWithType,
  TransformedDispatch,
} from "@sizeupdashboard/convex/src/api/schema.ts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DispatchCard } from "@/components/dispatch-list";
import { DispatchDetail } from "@/components/dispatch-detail";
import { diffDispatch } from "@/lib/transformations/dispatch-diff";
import { cn } from "@/utils/ui";
import { PreviewMap } from "./preview-map";
import { useDebouncedValue } from "./use-debounced-value";
import {
  toCriteria,
  toEngineConfigs,
  type DraftPreview,
  type PreviewMode,
} from "./types";

const MODES: PreviewMode[] = ["before", "after", "changes"];

/** Which public surface the pane is currently previewing (one at a time). */
type PreviewSurface = "list" | "detail" | "map";

const SURFACES: { key: PreviewSurface; label: string }[] = [
  { key: "list", label: "In the list" },
  { key: "detail", label: "When opened" },
  { key: "map", label: "On the map" },
];

function minutesAgo(timestamp: number): string {
  const mins = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

interface PreviewSlotProps {
  index: number;
  original: DispatchWithType;
  draft: DraftPreview;
  seed: number;
  mode: PreviewMode;
  locked: boolean;
  canRemove: boolean;
  onModeChange: (index: number, mode: PreviewMode) => void;
  onToggleLock: (index: number) => void;
  onShuffle: (index: number) => void;
  onPick: (index: number, dispatch: DispatchWithType) => void;
  onRemove: (index: number) => void;
}

/**
 * Owns the per-slot match/apply computation (kept out of the memoized pane so
 * the pane only re-renders when its derived inputs actually change).
 */
export function PreviewSlot({
  index,
  original,
  draft,
  seed,
  mode,
  locked,
  canRemove,
  onModeChange,
  onToggleLock,
  onShuffle,
  onPick,
  onRemove,
}: PreviewSlotProps) {
  const configs = useMemo(
    () => toEngineConfigs(draft.transformations),
    [draft.transformations],
  );
  const criteria = useMemo(() => toCriteria(draft), [draft]);

  const matched = useMemo(() => {
    try {
      return ruleMatchesDispatch(criteria, original);
    } catch {
      return false;
    }
  }, [criteria, original]);

  const transformed = useMemo<TransformedDispatch>(() => {
    if (!matched) return original;
    try {
      return applyTransformationConfigs(original, configs, {
        random: createSeededRandom(
          (seed ^ hashStringToSeed(original._id)) >>> 0,
        ),
      });
    } catch {
      return original;
    }
  }, [matched, original, configs, seed]);

  const handleModeChange = useCallback(
    (m: PreviewMode) => onModeChange(index, m),
    [onModeChange, index],
  );
  const handleToggleLock = useCallback(
    () => onToggleLock(index),
    [onToggleLock, index],
  );
  const handleShuffle = useCallback(
    () => onShuffle(index),
    [onShuffle, index],
  );
  const handlePick = useCallback(
    (d: DispatchWithType) => onPick(index, d),
    [onPick, index],
  );
  const handleRemove = useCallback(() => onRemove(index), [onRemove, index]);

  return (
    <PreviewPane
      original={original}
      transformed={transformed}
      matched={matched}
      mode={mode}
      locked={locked}
      canRemove={canRemove}
      configs={configs}
      criteria={criteria}
      onModeChange={handleModeChange}
      onToggleLock={handleToggleLock}
      onShuffle={handleShuffle}
      onPick={handlePick}
      onRemove={handleRemove}
    />
  );
}

interface PreviewPaneProps {
  original: DispatchWithType;
  transformed: TransformedDispatch;
  matched: boolean;
  mode: PreviewMode;
  locked: boolean;
  canRemove: boolean;
  configs: FieldTransformationConfig[];
  criteria: RuleCriteria;
  onModeChange: (mode: PreviewMode) => void;
  onToggleLock: () => void;
  onShuffle: () => void;
  onPick: (dispatch: DispatchWithType) => void;
  onRemove: () => void;
}

const PreviewPane = memo(function PreviewPane({
  original,
  transformed,
  matched,
  mode,
  locked,
  canRemove,
  configs,
  criteria,
  onModeChange,
  onToggleLock,
  onShuffle,
  onPick,
  onRemove,
}: PreviewPaneProps) {
  // One surface at a time; the map only renders when explicitly selected.
  const [surface, setSurface] = useState<PreviewSurface>("list");
  const shown: TransformedDispatch = mode === "before" ? original : transformed;
  const diff = useMemo(
    () => diffDispatch(original, transformed),
    [original, transformed],
  );

  const mapTransformed = mode === "before" ? original : transformed;
  const mapConfigs = mode === "before" ? [] : configs;

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden p-0",
        locked && "border-primary/55",
        !matched && "opacity-95",
      )}
    >
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <span className="text-sm font-bold">{original.type}</span>
        <span className="text-muted-foreground text-xs">
          {minutesAgo(original.dispatchCreatedAt)}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-bold",
            matched
              ? "bg-green-500/15 text-green-700 dark:text-green-400"
              : "bg-muted text-muted-foreground",
          )}
        >
          {matched ? "Matches this rule" : "Not matched — shown unchanged"}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <div className="mr-1 inline-flex overflow-hidden rounded-md border">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onModeChange(m)}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold capitalize",
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <IconButton
            tip={
              locked
                ? "Saved with the rule — will be here next time"
                : "Lock: save this dispatch with the rule"
            }
            active={locked}
            onClick={onToggleLock}
          >
            {locked ? <Lock className="size-4" /> : <Unlock className="size-4" />}
          </IconButton>

          <IconButton tip="Swap in a different recent dispatch" onClick={onShuffle}>
            <Shuffle className="size-4" />
          </IconButton>

          <PickDispatchPopover criteria={criteria} onPick={onPick} />

          {canRemove ? (
            <IconButton tip="Remove this test dispatch" onClick={onRemove}>
              <X className="size-4" />
            </IconButton>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1 border-b px-3 py-2">
        {SURFACES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSurface(s.key)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-semibold",
              surface === s.key
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className={cn("flex flex-col p-3", !matched && "opacity-60")}>
        {surface === "list" ? (
          <DispatchCard dispatch={shown} />
        ) : surface === "detail" ? (
          <DispatchDetail dispatch={shown} compact />
        ) : (
          <div className="flex min-h-[320px] flex-col">
            <PreviewMap
              original={original}
              transformed={mapTransformed}
              configs={mapConfigs}
            />
          </div>
        )}
      </div>

      {mode === "changes" ? (
        <div className="flex flex-col gap-1.5 border-t border-dashed p-3">
          {diff.length > 0 ? (
            diff.map((entry) => (
              <div
                key={entry.key}
                className="flex flex-wrap items-baseline gap-2 text-xs"
              >
                <span className="min-w-20 font-bold">{entry.label}</span>
                <span className="text-muted-foreground line-through [overflow-wrap:anywhere]">
                  {entry.before ?? "—"}
                </span>
                {entry.removed ? (
                  <span className="bg-destructive/15 text-destructive rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                    removed
                  </span>
                ) : (
                  <>
                    <span className="text-muted-foreground">→</span>
                    <span className="[overflow-wrap:anywhere]">
                      {entry.after ?? "—"}
                    </span>
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-xs italic">
              {matched
                ? "Rule matches but changes nothing yet — add a transformation."
                : "This dispatch is not matched by the rule."}
            </p>
          )}
        </div>
      ) : null}
    </Card>
  );
});

function IconButton({
  tip,
  active,
  onClick,
  children,
}: {
  tip: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("size-8", active && "text-primary bg-primary/10")}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}

interface PickDispatchPopoverProps {
  criteria: RuleCriteria;
  onPick: (dispatch: DispatchWithType) => void;
}

function PickDispatchPopover({ criteria, onPick }: PickDispatchPopoverProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="size-8">
              <Search className="size-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Choose a specific dispatch</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80 p-2">
        {open ? (
          <PickContent
            criteria={criteria}
            onPick={(d) => {
              onPick(d);
              setOpen(false);
            }}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function PickContent({
  criteria,
  onPick,
}: {
  criteria: RuleCriteria;
  onPick: (dispatch: DispatchWithType) => void;
}) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);

  const matches = useQuery(api.dispatches.getDispatchesMatchingRule, {
    criteria: {
      dispatchTypeRegex: criteria.dispatchTypeRegex,
      keywords: criteria.keywords,
      dispatchTypes: criteria.dispatchTypes as Id<"dispatchTypes">[],
    },
    limit: 8,
  });
  const searchResults = useQuery(
    api.dispatches.searchDispatchesForPicker,
    debouncedQuery.trim() ? { query: debouncedQuery, limit: 8 } : "skip",
  );

  return (
    <div className="flex flex-col gap-1">
      <Input
        autoFocus
        placeholder="Search narratives…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-1 h-8"
      />
      <div className="max-h-64 overflow-y-auto">
        {matches && matches.length > 0 ? (
          <PickGroup label="Matches this rule">
            {matches.map((d) => (
              <PickOption key={d._id} dispatch={d} onPick={onPick} />
            ))}
          </PickGroup>
        ) : null}
        {debouncedQuery.trim() ? (
          searchResults && searchResults.length > 0 ? (
            <PickGroup label="Search results">
              {searchResults.map((d) => (
                <PickOption key={d._id} dispatch={d} onPick={onPick} />
              ))}
            </PickGroup>
          ) : searchResults ? (
            <p className="text-muted-foreground px-2 py-2 text-xs">
              No matching dispatches.
            </p>
          ) : (
            <p className="text-muted-foreground px-2 py-2 text-xs">Searching…</p>
          )
        ) : null}
        {!debouncedQuery.trim() && matches && matches.length === 0 ? (
          <p className="text-muted-foreground px-2 py-2 text-xs">
            No dispatches match this rule yet — search by narrative above.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function PickGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <div className="text-muted-foreground px-2 pt-1 text-[10.5px] font-semibold tracking-wide uppercase">
        {label}
      </div>
      {children}
    </div>
  );
}

function PickOption({
  dispatch,
  onPick,
}: {
  dispatch: DispatchWithType;
  onPick: (dispatch: DispatchWithType) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(dispatch)}
      className="hover:bg-muted flex w-full flex-col rounded-sm px-2 py-1.5 text-left"
    >
      <span className="text-sm font-medium">{dispatch.type}</span>
      <span className="text-muted-foreground text-xs">
        {dispatch.address ?? "no address"} ·{" "}
        {minutesAgo(dispatch.dispatchCreatedAt)}
      </span>
    </button>
  );
}
