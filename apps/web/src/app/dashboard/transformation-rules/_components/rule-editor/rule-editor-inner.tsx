"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type { Id } from "@sizeupdashboard/convex/src/api/_generated/dataModel.js";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/utils/ui";
import type { TransformationStrategy } from "@/lib/transformations/fields";
import { RuleFormPanel } from "./rule-form-panel";
import { PreviewWorkspace } from "./preview-workspace";
import {
  DASHBOARD_TRANSFORMATION_RULES_URL,
  type RuleEditorFormValues,
  type RuleFormApi,
} from "./types";

const ruleFormSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  enabled: z.boolean(),
  dispatchTypeRegex: z.string(),
  keywords: z.array(z.string()),
  dispatchTypes: z.array(z.string()),
  transformations: z.array(
    z.object({
      key: z.string(),
      libraryId: z.string().optional(),
      name: z.string().min(1, "Name is required"),
      field: z.string().min(1, "Field is required"),
      strategy: z.string().min(1, "Strategy is required"),
      params: z.record(z.string(), z.unknown()),
    }),
  ),
});

function sameIdSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((id) => setB.has(id));
}

interface RuleEditorInnerProps {
  ruleId?: Id<"transformationRules">;
  ruleName?: string;
  defaultValues: RuleEditorFormValues;
  initialTestDispatchIds: Id<"dispatches">[];
}

export function RuleEditorInner({
  ruleId,
  ruleName,
  defaultValues,
  initialTestDispatchIds,
}: RuleEditorInnerProps) {
  const router = useRouter();
  const saveRule = useMutation(
    api.transformations.saveRuleWithTransformations,
  );

  const dispatchTypes = useQuery(api.dispatches.getDispatchTypes);
  const recent = usePaginatedQuery(
    api.dispatches.listDispatchesForPicker,
    {},
    { initialNumItems: 25 },
  );

  // Locked test-dispatch ids are owned by the preview but needed here for the
  // save payload and dirty state. Baseline resets after a successful save.
  const [lockedTestIds, setLockedTestIds] = useState<Id<"dispatches">[]>(
    initialTestDispatchIds,
  );
  const [baselineLockedIds, setBaselineLockedIds] = useState<
    Id<"dispatches">[]
  >(initialTestDispatchIds);
  const lockedTestIdsRef = useRef<Id<"dispatches">[]>(initialTestDispatchIds);
  useEffect(() => {
    lockedTestIdsRef.current = lockedTestIds;
  }, [lockedTestIds]);

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const parsed = ruleFormSchema.safeParse(value);
      if (!parsed.success) {
        toast.error(
          parsed.error.issues[0]?.message ?? "Please fix the highlighted fields",
        );
        return;
      }
      try {
        const finalId = await saveRule({
          ruleId,
          rule: {
            name: value.name.trim(),
            dispatchTypeRegex: value.dispatchTypeRegex,
            keywords: value.keywords,
            dispatchTypes: value.dispatchTypes as Id<"dispatchTypes">[],
            enabled: value.enabled,
            testDispatchIds: lockedTestIdsRef.current,
          },
          transformations: value.transformations
            .filter((c) => c.field && c.strategy)
            .map((c) => ({
              id: c.libraryId,
              name: c.name.trim() || "Transformation",
              field: c.field,
              strategy: c.strategy as TransformationStrategy,
              params: c.params,
            })),
        });
        toast.success(ruleId ? "Rule saved" : "Rule created");
        if (ruleId) {
          // Reset the dirty baseline in place.
          form.reset(value);
          setBaselineLockedIds(lockedTestIdsRef.current);
        } else {
          router.replace(`${DASHBOARD_TRANSFORMATION_RULES_URL}/${finalId}`);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save rule",
        );
      }
    },
  });

  const formIsDirty = useStore(form.store, (s) => s.isDirty);
  const isSubmitting = useStore(form.store, (s) => s.isSubmitting);
  const canSave = useStore(form.store, (s) => {
    const v = s.values;
    if (!v.name.trim()) return false;
    return v.transformations.every((c) => c.field && c.strategy);
  });

  const locksDirty = !sameIdSet(lockedTestIds, baselineLockedIds);
  const dirty = formIsDirty || locksDirty;

  // Warn on hard navigation / tab close while there are unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const handleLockedIdsChange = useCallback((ids: Id<"dispatches">[]) => {
    setLockedTestIds(ids);
  }, []);

  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const leave = useCallback(() => {
    router.push(DASHBOARD_TRANSFORMATION_RULES_URL);
  }, [router]);
  const handleBack = useCallback(() => {
    if (dirty) {
      setShowLeaveDialog(true);
    } else {
      leave();
    }
  }, [dirty, leave]);

  const title = ruleId
    ? `Edit rule${ruleName ? ` — ${ruleName}` : ""}`
    : "New rule";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(360px,480px)_1fr] lg:items-start">
        <div className="flex flex-col gap-4">
          <RuleFormPanel
            form={form as unknown as RuleFormApi}
            ruleId={ruleId}
            dispatchTypes={dispatchTypes}
            recentDispatches={recent.results}
          />

          <div className="bg-card sticky bottom-0 z-10 flex items-center gap-3 rounded-md border p-3 shadow-sm">
            {dirty ? (
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                ● Unsaved changes
              </span>
            ) : null}
            <div className="flex-1" />
            <Button variant="ghost" type="button" onClick={handleBack}>
              <ArrowLeft className="mr-1 size-4" />
              Back to rules
            </Button>
            <Button
              type="button"
              disabled={!canSave || isSubmitting}
              onClick={() => void form.handleSubmit()}
            >
              {isSubmitting ? "Saving…" : "Save rule"}
            </Button>
          </div>
        </div>

        <PreviewWorkspace
          form={form as unknown as RuleFormApi}
          recent={recent}
          initialTestDispatchIds={initialTestDispatchIds}
          onLockedIdsChange={handleLockedIdsChange}
        />
      </div>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved edits to this rule. Leaving now will discard them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              className={cn(
                "bg-destructive text-white hover:bg-destructive/90",
              )}
              onClick={leave}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
