import type { ReactNode } from "react";
import type { AnyFieldApi, AnyFormApi } from "@tanstack/react-form";
import type { Id } from "@sizeupdashboard/convex/src/api/_generated/dataModel.js";
import type {
  FieldTransformationConfig,
  RuleCriteria,
} from "@sizeupdashboard/convex/src/lib/transform/core.ts";
import type {
  FieldName,
  TransformationStrategy,
} from "@/lib/transformations/fields";

/** A single inline transformation row inside the editor form. */
export interface InlineConfig {
  /** Stable uid for React keys (never sent to the server). */
  key: string;
  /** Present when this row is backed by a shared library transformation. */
  libraryId?: Id<"fieldTransformations">;
  name: string;
  field: FieldName | "";
  strategy: TransformationStrategy | "";
  params: Record<string, unknown>;
}

/** The full editor form shape driven by a single TanStack Form instance. */
export interface RuleEditorFormValues {
  name: string;
  enabled: boolean;
  dispatchTypeRegex: string;
  keywords: string[];
  dispatchTypes: string[];
  transformations: InlineConfig[];
}

/** The subset of form state selectors in this editor read from. */
export interface RuleFormState {
  values: RuleEditorFormValues;
  isDirty: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
}

/**
 * Structural view of the TanStack form passed to child panels. Mirrors the
 * `TransformationParamsForm` cast pattern already used in the codebase so the
 * real form can be shared across files without spelling out its 12 generics.
 */
export interface RuleFormApi extends AnyFormApi {
  Field: (props: {
    name: string;
    mode?: "value" | "array";
    validators?: {
      onChange?: (args: { value: unknown }) => string | undefined;
    };
    children: (field: AnyFieldApi) => ReactNode;
  }) => ReactNode;
  Subscribe: <TSelected>(props: {
    selector?: (state: RuleFormState) => TSelected;
    children: ((state: TSelected) => ReactNode) | ReactNode;
  }) => ReactNode;
}

export type PreviewMode = "before" | "after" | "changes";

/** A test-dispatch slot in the live preview (component state, not form state). */
export interface TestSlot {
  dispatchId: Id<"dispatches">;
  locked: boolean;
  mode: PreviewMode;
}

/**
 * The narrow slice of draft values the preview subscribes to. Everything the
 * match/apply engine needs — nothing that would force a needless recompute.
 */
export interface DraftPreview {
  dispatchTypeRegex: string;
  keywords: string[];
  dispatchTypes: string[];
  transformations: InlineConfig[];
}

/** Default parameter bag written whenever field/strategy changes. */
export const DEFAULT_PARAMS: Record<string, unknown> = {
  value: "",
  minOffset: -0.002,
  maxOffset: 0.002,
  length: 8,
  charset: "alphanumeric",
  template: "",
};

let uidCounter = 0;
export function uid(prefix = "cfg"): string {
  uidCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${uidCounter}`;
}

/** Map an inline row to the engine's config shape (drops incomplete rows). */
export function toEngineConfigs(
  configs: InlineConfig[],
): FieldTransformationConfig[] {
  return configs
    .filter((c) => c.field && c.strategy)
    .map((c) => ({
      name: c.name,
      field: c.field,
      strategy: c.strategy as TransformationStrategy,
      params: c.params,
    }));
}

/** Build the match criteria the engine consumes from the draft. */
export function toCriteria(draft: DraftPreview): RuleCriteria {
  return {
    dispatchTypeRegex: draft.dispatchTypeRegex,
    keywords: draft.keywords,
    dispatchTypes: draft.dispatchTypes,
  };
}

export const DASHBOARD_TRANSFORMATION_RULES_URL =
  "/dashboard/transformation-rules";
