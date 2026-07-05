"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useStore } from "@tanstack/react-form";
import { useQuery } from "convex/react";
import { Dices, Plus } from "lucide-react";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type { Id } from "@sizeupdashboard/convex/src/api/_generated/dataModel.js";
import type { DispatchWithType } from "@sizeupdashboard/convex/src/api/schema.ts";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SAMPLE_DISPATCH } from "@/lib/transformations/sample-dispatch";
import { PreviewSlot } from "./preview-pane";
import { useDebouncedValue } from "./use-debounced-value";
import {
  type DraftPreview,
  type PreviewMode,
  type RuleEditorFormValues,
  type RuleFormApi,
  type TestSlot,
} from "./types";

const MAX_SLOTS = 3;

interface RecentPool {
  results: DispatchWithType[];
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
  loadMore: (numItems: number) => void;
  isLoading: boolean;
}

interface PreviewWorkspaceProps {
  form: RuleFormApi;
  recent: RecentPool;
  initialTestDispatchIds: Id<"dispatches">[];
  onLockedIdsChange: (ids: Id<"dispatches">[]) => void;
}

export function PreviewWorkspace({
  form,
  recent,
  initialTestDispatchIds,
  onLockedIdsChange,
}: PreviewWorkspaceProps) {
  const [slots, setSlots] = useState<TestSlot[] | null>(null);
  const [seed, setSeed] = useState(1);
  // Dispatches chosen via the per-pane picker keep their full object here so
  // they survive even though they may not be in the recent pool.
  const [pickedCache, setPickedCache] = useState<
    Record<string, DispatchWithType>
  >({});

  const lockedDispatches = useQuery(
    api.dispatches.getDispatchesByIds,
    initialTestDispatchIds.length
      ? { ids: initialTestDispatchIds }
      : "skip",
  );

  const isEmptyDb =
    recent.status === "Exhausted" &&
    recent.results.length === 0 &&
    initialTestDispatchIds.length === 0;

  // Resolve a dispatch id to its full object from any known source.
  const cache = useMemo(() => {
    const map = new Map<string, DispatchWithType>();
    for (const d of recent.results) map.set(d._id, d);
    for (const d of lockedDispatches ?? []) map.set(d._id, d);
    for (const d of Object.values(pickedCache)) map.set(d._id, d);
    if (isEmptyDb) map.set(SAMPLE_DISPATCH._id, SAMPLE_DISPATCH);
    return map;
  }, [recent.results, lockedDispatches, pickedCache, isEmptyDb]);

  // Seed slots exactly once, as soon as the recent pool + locked-id hydration
  // are ready. Using the null slots value as the guard (React's supported
  // "adjust state while rendering" pattern) keeps this out of an effect.
  if (slots === null) {
    const byIdsReady =
      initialTestDispatchIds.length === 0 || lockedDispatches !== undefined;
    const recentReady = recent.status !== "LoadingFirstPage";
    if (byIdsReady && recentReady) {
      const next: TestSlot[] = initialTestDispatchIds.map((id) => ({
        dispatchId: id,
        locked: true,
        mode: "after" as PreviewMode,
      }));
      for (const d of recent.results) {
        if (next.length >= 2) break;
        if (!next.some((s) => s.dispatchId === d._id)) {
          next.push({ dispatchId: d._id, locked: false, mode: "after" });
        }
      }
      if (next.length === 0 && isEmptyDb) {
        next.push({
          dispatchId: SAMPLE_DISPATCH._id,
          locked: false,
          mode: "after",
        });
      }
      setSlots(next);
    }
  }

  // Report locked ids upward for the save payload + dirty tracking.
  useEffect(() => {
    if (slots === null) return;
    onLockedIdsChange(slots.filter((s) => s.locked).map((s) => s.dispatchId));
  }, [slots, onLockedIdsChange]);

  // Narrow subscription to the draft values the engine consumes.
  const draftRaw = useStore(form.store, (s) => {
    const v = (s as { values: RuleEditorFormValues }).values;
    return {
      dispatchTypeRegex: v.dispatchTypeRegex,
      keywords: v.keywords,
      dispatchTypes: v.dispatchTypes,
      transformations: v.transformations,
    } satisfies DraftPreview;
  });
  const debouncedDraft = useDebouncedValue(draftRaw, 250);
  const deferredDraft = useDeferredValue(debouncedDraft);

  const addSlot = useCallback(() => {
    setSlots((prev) => {
      if (!prev || prev.length >= MAX_SLOTS) return prev;
      const used = new Set(prev.map((s) => s.dispatchId));
      const next = recent.results.find((d) => !used.has(d._id));
      const fallback =
        !next && isEmptyDb && !used.has(SAMPLE_DISPATCH._id)
          ? SAMPLE_DISPATCH
          : undefined;
      const chosen = next ?? fallback;
      if (!chosen) return prev;
      return [
        ...prev,
        { dispatchId: chosen._id, locked: false, mode: "after" },
      ];
    });
  }, [recent.results, isEmptyDb]);

  const setSlotMode = useCallback((index: number, mode: PreviewMode) => {
    setSlots((prev) =>
      prev ? prev.map((s, i) => (i === index ? { ...s, mode } : s)) : prev,
    );
  }, []);

  const toggleLock = useCallback((index: number) => {
    setSlots((prev) =>
      prev
        ? prev.map((s, i) => (i === index ? { ...s, locked: !s.locked } : s))
        : prev,
    );
  }, []);

  const shuffleSlot = useCallback(
    (index: number) => {
      setSlots((prev) => {
        const pool = recent.results;
        if (!prev || pool.length === 0) return prev;
        const used = new Set(prev.map((s) => s.dispatchId));
        const currentIdx = pool.findIndex(
          (d) => d._id === prev[index]?.dispatchId,
        );
        for (let k = 1; k <= pool.length; k++) {
          const cand = pool[(currentIdx + k + pool.length) % pool.length];
          if (cand && !used.has(cand._id)) {
            return prev.map((s, i) =>
              i === index
                ? { ...s, dispatchId: cand._id, locked: false }
                : s,
            );
          }
        }
        return prev;
      });
    },
    [recent.results],
  );

  const pickSlot = useCallback((index: number, dispatch: DispatchWithType) => {
    setPickedCache((prev) => ({ ...prev, [dispatch._id]: dispatch }));
    setSlots((prev) =>
      prev
        ? prev.map((s, i) =>
            i === index
              ? { ...s, dispatchId: dispatch._id, locked: true }
              : s,
          )
        : prev,
    );
  }, []);

  const removeSlot = useCallback((index: number) => {
    setSlots((prev) => (prev ? prev.filter((_, i) => i !== index) : prev));
  }, []);

  const rerollSeed = () => setSeed((s) => s + 1);

  const slotList = slots ?? [];

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-muted-foreground flex-1 text-xs font-semibold tracking-wide uppercase">
          Live preview — what the public will see
        </h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={rerollSeed}
            >
              <Dices className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Re-roll random values</TooltipContent>
        </Tooltip>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSlot}
          disabled={!slots || slots.length >= MAX_SLOTS}
        >
          <Plus className="mr-1 size-4" />
          Test dispatch
        </Button>
      </div>

      {isEmptyDb ? (
        <p className="text-muted-foreground mt-3 text-xs">
          No dispatches in the database yet — showing a sample dispatch so you
          can preview the effect.
        </p>
      ) : null}

      <div className="mt-3 flex flex-col gap-3">
        {slots === null ? (
          <div className="bg-muted/40 h-40 animate-pulse rounded-lg border" />
        ) : slots.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No test dispatch selected — add one to preview the effect.
          </p>
        ) : null}
        {slotList.map((slot, index) => {
          const original = cache.get(slot.dispatchId);
          if (!original) {
            return (
              <div
                key={slot.dispatchId}
                className="bg-muted/40 h-40 animate-pulse rounded-lg border"
              />
            );
          }
          return (
            <PreviewSlot
              key={slot.dispatchId}
              index={index}
              original={original}
              draft={deferredDraft}
              seed={seed}
              mode={slot.mode}
              locked={slot.locked}
              canRemove={slotList.length > 1}
              onModeChange={setSlotMode}
              onToggleLock={toggleLock}
              onShuffle={shuffleSlot}
              onPick={pickSlot}
              onRemove={removeSlot}
            />
          );
        })}
      </div>
    </div>
  );
}
