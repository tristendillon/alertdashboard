"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type { Id } from "@sizeupdashboard/convex/src/api/_generated/dataModel.js";
import type { TransformationRule } from "@sizeupdashboard/convex/src/api/schema.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldInfo } from "@/components/ui/field-info";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

const ruleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  dispatchTypeRegex: z.string(),
  keywords: z.array(z.string()),
  keywordInput: z.string(),
  dispatchTypes: z.array(z.string()),
  transformations: z
    .array(z.string())
    .min(1, "At least one transformation must be selected"),
});

interface TransformationRuleFormProps {
  id?: string;
  onDone: () => void;
}

export function TransformationRuleForm({ id, onDone }: TransformationRuleFormProps) {
  const rules = useQuery(api.transformations.getTransformationRules, id ? {} : "skip");
  const existing = id ? rules?.find((r) => r._id === id) : null;

  if (id && rules === undefined) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (id && !existing) {
    return (
      <div className="p-4">
        <SheetHeader>
          <SheetTitle>Transformation rule not found</SheetTitle>
        </SheetHeader>
        <Button className="mt-4" variant="outline" onClick={onDone}>
          Close
        </Button>
      </div>
    );
  }

  return <TransformationRuleFormInner existing={existing ?? null} onDone={onDone} />;
}

function TransformationRuleFormInner({
  existing,
  onDone,
}: {
  existing: TransformationRule | null;
  onDone: () => void;
}) {
  const isEdit = existing !== null;
  const createRule = useMutation(api.transformations.createTransformationRule);
  const updateRule = useMutation(api.transformations.updateTransformationRule);

  const fieldTransformations = useQuery(api.transformations.getFieldTransformations, {});
  const dispatchTypes = useQuery(api.dispatches.getDispatchTypes);

  const form = useForm({
    validators: { onSubmit: ruleSchema },
    defaultValues: {
      name: existing?.name ?? "",
      dispatchTypeRegex: existing?.dispatchTypeRegex ?? "",
      keywords: existing?.keywords ?? ([] as string[]),
      keywordInput: "",
      dispatchTypes: (existing?.dispatchTypes ?? []) as string[],
      transformations: (existing?.transformations ?? []) as string[],
    },
    onSubmit: async ({ value }) => {
      const payload = {
        name: value.name,
        dispatchTypeRegex: value.dispatchTypeRegex,
        keywords: value.keywords,
        dispatchTypes: value.dispatchTypes as Id<"dispatchTypes">[],
        transformations: value.transformations as Id<"fieldTransformations">[],
      };
      try {
        if (isEdit && existing) {
          await updateRule({ id: existing._id, enabled: existing.enabled, ...payload });
          toast.success("Rule updated");
        } else {
          await createRule(payload);
          toast.success("Rule created");
        }
        onDone();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed");
      }
    },
  });

  const addKeyword = (keyword: string) => {
    const k = keyword.trim();
    if (!k) return;
    form.setFieldValue("keywords", (prev) => (prev.includes(k) ? prev : [...prev, k]));
    form.setFieldValue("keywordInput", "");
  };
  const toggle = (name: "dispatchTypes" | "transformations", value: string) =>
    form.setFieldValue(name, (prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );

  return (
    <>
      <SheetHeader>
        <SheetTitle>{isEdit ? "Edit transformation rule" : "New transformation rule"}</SheetTitle>
        <SheetDescription>
          Matches dispatches (by type regex, keywords, or dispatch type) and
          applies field transformations to redact them for public viewers.
        </SheetDescription>
      </SheetHeader>

      <form
        id="transformation-rule-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="flex-1 space-y-5 overflow-y-auto px-4"
      >
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => (!value ? "Rule name is required" : undefined),
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Rule name</Label>
              <Input
                id={field.name}
                placeholder="e.g., Medical Privacy Rule"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        <div className="space-y-4 border-t pt-4">
          <h3 className="text-base font-medium">Matching criteria</h3>
          <p className="text-muted-foreground text-sm">
            A dispatch matches if any criterion matches.
          </p>

          <form.Field name="dispatchTypeRegex">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Dispatch type regex</Label>
                <Input
                  id={field.name}
                  placeholder="e.g., ^(MEDICAL|EMS).*"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <p className="text-muted-foreground text-xs">
                  Matched case-insensitively against the dispatch type string.
                </p>
              </div>
            )}
          </form.Field>

          <div className="space-y-2">
            <Label>Keywords</Label>
            <form.Field name="keywordInput">
              {(field) => (
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., medical, ambulance"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onKeyUp={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addKeyword(field.state.value);
                      }
                    }}
                  />
                  <Button type="button" onClick={() => addKeyword(field.state.value)}>
                    Add
                  </Button>
                </div>
              )}
            </form.Field>
            <form.Subscribe selector={(s) => [s.values.keywords]}>
              {([keywords]) =>
                keywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="gap-1">
                        {keyword}
                        <button
                          type="button"
                          onClick={() =>
                            form.setFieldValue("keywords", (prev) =>
                              prev.filter((k) => k !== keyword),
                            )
                          }
                          className="hover:text-destructive ml-1"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )
              }
            </form.Subscribe>
          </div>

          <form.Subscribe selector={(s) => [s.values.dispatchTypes]}>
            {([selected]) => (
              <div className="space-y-2">
                <Label>Dispatch types</Label>
                <p className="text-muted-foreground text-xs">
                  Optional: match specific dispatch types directly.
                </p>
                {dispatchTypes === undefined ? (
                  <Skeleton className="h-16 w-full" />
                ) : dispatchTypes.length === 0 ? (
                  <p className="text-muted-foreground py-2 text-sm">
                    No dispatch types defined.
                  </p>
                ) : (
                  <div className="grid max-h-40 grid-cols-1 gap-1.5 overflow-y-auto rounded-md border p-2">
                    {dispatchTypes.map((dt) => (
                      <label key={dt._id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={selected.includes(dt._id)}
                          onCheckedChange={() => toggle("dispatchTypes", dt._id)}
                        />
                        <span className="font-mono">{dt.code}</span>
                        {dt.name && (
                          <span className="text-muted-foreground">— {dt.name}</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </form.Subscribe>
        </div>

        <form.Subscribe selector={(s) => [s.values.transformations]}>
          {([selected]) => (
            <form.Field
              name="transformations"
              validators={{
                onChange: ({ value }) =>
                  !value || value.length === 0
                    ? "Select at least one transformation"
                    : undefined,
              }}
            >
              {(field) => (
                <div className="space-y-2 border-t pt-4">
                  <h3 className="text-base font-medium">Applied transformations</h3>
                  {fieldTransformations === undefined ? (
                    <Skeleton className="h-16 w-full" />
                  ) : fieldTransformations.length === 0 ? (
                    <p className="text-muted-foreground py-2 text-sm">
                      No field transformations yet — create some first.
                    </p>
                  ) : (
                    <div className="grid max-h-52 grid-cols-1 gap-1.5 overflow-y-auto rounded-md border p-2">
                      {fieldTransformations.map((t) => (
                        <label key={t._id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selected.includes(t._id)}
                            onCheckedChange={() => toggle("transformations", t._id)}
                          />
                          <span className="font-medium">{t.name}</span>
                          <span className="text-muted-foreground">
                            {t.field} • {t.strategy}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
          )}
        </form.Subscribe>
      </form>

      <SheetFooter>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" form="transformation-rule-form" disabled={!canSubmit}>
              {isSubmitting
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save changes"
                  : "Create rule"}
            </Button>
          )}
        </form.Subscribe>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </SheetFooter>
    </>
  );
}
