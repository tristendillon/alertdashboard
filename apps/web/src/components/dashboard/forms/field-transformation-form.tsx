"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { useQueryState } from "nuqs";
import { toast } from "sonner";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldInfo } from "@/components/ui/field-info";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FIELD_OPTIONS,
  getAvailableStrategies,
  type FieldName,
  type TransformationStrategy,
} from "@/lib/transformations/fields";
import {
  TransformationParams,
  type TransformationParamsForm,
} from "@/components/dashboard/transformation-params";
import type { TemplateField } from "@/components/ui/template-input";
import type { FieldTransformation } from "@sizeupdashboard/convex/src/api/schema.js";

// Fields the merge_data template autocomplete can reference.
const TEMPLATE_FIELDS: TemplateField[] = FIELD_OPTIONS.filter(
  (o) => o.value !== "location",
).map((o) => ({ key: o.value, label: o.label.replace(/\s*\(.*\)$/, "") }));

const isFieldName = (value: string): value is FieldName =>
  FIELD_OPTIONS.some((o) => o.value === value);

interface FieldTransformationFormProps {
  id?: string;
  onDone: () => void;
}

export function FieldTransformationForm({
  id,
  onDone,
}: FieldTransformationFormProps) {
  const all = useQuery(
    api.transformations.getFieldTransformations,
    id ? {} : "skip",
  );
  const existing = id ? all?.find((t) => t._id === id) : null;

  if (id && all === undefined) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  if (id && !existing) {
    return (
      <div className="p-4">
        <SheetHeader>
          <SheetTitle>Field transformation not found</SheetTitle>
        </SheetHeader>
        <Button className="mt-4" variant="outline" onClick={onDone}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <FieldTransformationFormInner existing={existing ?? null} onDone={onDone} />
  );
}

function FieldTransformationFormInner({
  existing,
  onDone,
}: {
  existing: FieldTransformation | null;
  onDone: () => void;
}) {
  const isEdit = existing !== null;
  const [fieldParam] = useQueryState("field");
  const createTransformation = useMutation(
    api.transformations.createFieldTransformation,
  );
  const updateTransformation = useMutation(
    api.transformations.updateFieldTransformation,
  );

  // In CREATE mode, a `?field=<key>` URL param preselects that field.
  const preselectedField =
    !isEdit && fieldParam && isFieldName(fieldParam) ? fieldParam : "";

  const form = useForm({
    defaultValues: {
      name: existing?.name ?? "",
      field: (existing?.field ?? preselectedField) as FieldName | "",
      strategy: existing?.strategy ?? ("" as TransformationStrategy | ""),
      params: (existing?.params ?? {
        value: "",
        minOffset: 0,
        maxOffset: 0,
        length: 8,
        charset: "alphanumeric",
        template: "",
      }) as Record<string, unknown>,
    },
    onSubmit: async ({ value }) => {
      if (!value.name.trim()) return toast.error("Name is required");
      if (!value.field) return toast.error("Field is required");
      if (!value.strategy) return toast.error("Strategy is required");
      try {
        const payload = {
          name: value.name.trim(),
          field: value.field,
          strategy: value.strategy,
          params: value.params,
        };
        if (isEdit && existing) {
          await updateTransformation({ id: existing._id, ...payload });
          toast.success("Field transformation updated");
        } else {
          await createTransformation(payload);
          toast.success("Field transformation created");
        }
        onDone();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed");
      }
    },
  });

  const resetParams = () =>
    form.setFieldValue("params", {
      value: "",
      minOffset: 0,
      maxOffset: 0,
      length: 8,
      charset: "alphanumeric",
      template: "",
    });

  return (
    <>
      <SheetHeader>
        <SheetTitle>
          {isEdit ? "Edit field transformation" : "New field transformation"}
        </SheetTitle>
        <SheetDescription>
          A reusable rule that rewrites one dispatch field before it reaches
          public viewers.
        </SheetDescription>
      </SheetHeader>

      <form
        id="field-transformation-form"
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
            onChange: ({ value }) => (!value ? "Name is required" : undefined),
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Name</Label>
              <Input
                id={field.name}
                placeholder="e.g., Address Redaction"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        <form.Field
          name="field"
          validators={{
            onChange: ({ value }) => (!value ? "Field is required" : undefined),
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Field</Label>
              <Select
                onValueChange={(v) => {
                  field.handleChange(v as FieldName);
                  form.setFieldValue("strategy", "" as TransformationStrategy);
                  resetParams();
                }}
                value={field.state.value || undefined}
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
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        <form.Subscribe selector={(s) => [s.values.field]}>
          {([selectedField]) => (
            <form.Field
              name="strategy"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Strategy is required" : undefined,
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Strategy</Label>
                  <Select
                    onValueChange={(v) => {
                      field.handleChange(v as TransformationStrategy);
                      resetParams();
                    }}
                    value={field.state.value || undefined}
                    disabled={!selectedField}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          selectedField
                            ? "Select a strategy"
                            : "Select a field first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedField &&
                        getAvailableStrategies(selectedField as FieldName).map(
                          (o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label} — {o.description}
                            </SelectItem>
                          ),
                        )}
                    </SelectContent>
                  </Select>
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
          )}
        </form.Subscribe>

        <form.Subscribe selector={(s) => [s.values.strategy, s.values.field]}>
          {([strategy, fieldName]) =>
            strategy && fieldName ? (
              <div className="space-y-3 border-t pt-4">
                <Label className="text-base font-medium">Parameters</Label>
                <TransformationParams
                  form={form as unknown as TransformationParamsForm}
                  basePath="params"
                  strategy={strategy as TransformationStrategy}
                  field={fieldName as FieldName}
                  fieldsForTemplate={TEMPLATE_FIELDS}
                />
              </div>
            ) : null
          }
        </form.Subscribe>
      </form>

      <SheetFooter>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              form="field-transformation-form"
              disabled={!canSubmit}
            >
              {isSubmitting
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save changes"
                  : "Create transformation"}
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
