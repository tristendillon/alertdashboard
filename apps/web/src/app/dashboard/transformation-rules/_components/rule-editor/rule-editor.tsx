"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ArrowLeft } from "lucide-react";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type { Id } from "@sizeupdashboard/convex/src/api/_generated/dataModel.js";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { FieldName, TransformationStrategy } from "@/lib/transformations/fields";
import { RuleEditorInner } from "./rule-editor-inner";
import {
  DASHBOARD_TRANSFORMATION_RULES_URL,
  uid,
  type InlineConfig,
  type RuleEditorFormValues,
} from "./types";

interface RuleEditorProps {
  ruleId?: string;
}

export function RuleEditor({ ruleId }: RuleEditorProps) {
  const rule = useQuery(
    api.transformations.getTransformationRuleWithTransformations,
    ruleId ? { ruleId: ruleId as Id<"transformationRules"> } : "skip",
  );

  if (ruleId && rule === undefined) {
    return <RuleEditorSkeleton />;
  }

  if (ruleId && rule === null) {
    return <RuleNotFound />;
  }

  return <RuleEditorLoaded ruleId={ruleId} rule={rule ?? null} />;
}

type LoadedRule = NonNullable<
  FunctionReturnType<
    typeof api.transformations.getTransformationRuleWithTransformations
  >
>;

function RuleEditorLoaded({
  ruleId,
  rule,
}: {
  ruleId?: string;
  rule: LoadedRule | null;
}) {
  // defaultValues are computed exactly once per mount so the form's dirty
  // tracking has a stable baseline (same pattern as the drawer forms).
  const defaultValues = useMemo<RuleEditorFormValues>(() => {
    if (!rule) {
      return {
        name: "",
        enabled: true,
        dispatchTypeRegex: "",
        keywords: [],
        dispatchTypes: [],
        transformations: [],
      };
    }

    const detailById = new Map(
      rule.transformationDetails
        .filter((t): t is NonNullable<typeof t> => t !== null)
        .map((t) => [t._id, t] as const),
    );
    const transformations: InlineConfig[] = rule.transformations
      .map((id): InlineConfig | null => {
        const detail = detailById.get(id);
        if (!detail) return null;
        return {
          key: uid(),
          libraryId: detail._id,
          name: detail.name,
          field: detail.field as FieldName,
          strategy: detail.strategy as TransformationStrategy,
          params: { ...(detail.params ?? {}) },
        };
      })
      .filter((c): c is InlineConfig => c !== null);

    return {
      name: rule.name,
      enabled: rule.enabled !== false,
      dispatchTypeRegex: rule.dispatchTypeRegex,
      keywords: [...rule.keywords],
      dispatchTypes: [...rule.dispatchTypes],
      transformations,
    };
    // rule reference is stable after load; intentional one-time compute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialTestDispatchIds = useMemo<Id<"dispatches">[]>(
    () => [...(rule?.testDispatchIds ?? [])],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <RuleEditorInner
      ruleId={ruleId ? (ruleId as Id<"transformationRules">) : undefined}
      ruleName={rule?.name}
      defaultValues={defaultValues}
      initialTestDispatchIds={initialTestDispatchIds}
    />
  );
}

function RuleEditorSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-6 lg:grid-cols-[minmax(360px,480px)_1fr]">
        <Skeleton className="h-[520px] w-full" />
        <Skeleton className="h-[520px] w-full" />
      </div>
    </div>
  );
}

function RuleNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <h2 className="text-xl font-semibold">Rule not found</h2>
      <p className="text-muted-foreground text-sm">
        This transformation rule may have been deleted, or the link is out of
        date.
      </p>
      <Button asChild variant="outline">
        <Link href={DASHBOARD_TRANSFORMATION_RULES_URL}>
          <ArrowLeft className="mr-1 size-4" />
          Back to rules
        </Link>
      </Button>
    </div>
  );
}
