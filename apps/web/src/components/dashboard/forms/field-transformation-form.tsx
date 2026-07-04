"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldInfo } from "@/components/ui/field-info";
import { Textarea } from "@/components/ui/textarea";
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
import type { FieldTransformation } from "@sizeupdashboard/convex/src/api/schema.js";

type TransformationStrategy =
  | "static_value"
  | "random_offset"
  | "random_string"
  | "merge_data";

const fieldSchemas = {
  address: z.string(),
  address2: z.string(),
  city: z.string(),
  stateCode: z.string(),
  narrative: z.string(),
  "location.lat": z.number(),
  "location.lng": z.number(),
  unitCodes: z.array(z.string()),
  type: z.string(),
  dispatchId: z.string(),
} as const;

type FieldName = keyof typeof fieldSchemas;

const FIELD_OPTIONS: FieldName[] = [
  "address",
  "address2",
  "city",
  "stateCode",
  "narrative",
  "location.lat",
  "location.lng",
  "unitCodes",
  "type",
  "dispatchId",
];

const STRATEGY_OPTIONS: {
  value: TransformationStrategy;
  label: string;
  description: string;
}[] = [
  {
    value: "static_value",
    label: "Static Value",
    description: "Replace field with a fixed value (redaction)",
  },
  {
    value: "random_offset",
    label: "Random Offset",
    description: "Add random offset to numeric values",
  },
  {
    value: "random_string",
    label: "Random String",
    description: "Generate random string replacement",
  },
  {
    value: "merge_data",
    label: "Merge Data",
    description: "Combine data from other fields",
  },
];

const getFieldType = (fieldName: FieldName): "string" | "number" | "array" => {
  const schema = fieldSchemas[fieldName];
  if (schema instanceof z.ZodString) return "string";
  if (schema instanceof z.ZodNumber) return "number";
  if (schema instanceof z.ZodArray) return "array";
  return "string";
};

const validateStaticValue = (value: string, fieldName: FieldName) => {
  const fieldType = getFieldType(fieldName);
  switch (fieldType) {
    case "number":
      if (isNaN(Number(value))) return `Value must be a valid number`;
      break;
    case "array":
      try {
        JSON.parse(value);
      } catch {
        return `Value must be a valid JSON array`;
      }
      break;
  }
  return undefined;
};

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

  return <FieldTransformationFormInner existing={existing ?? null} onDone={onDone} />;
}

function FieldTransformationFormInner({
  existing,
  onDone,
}: {
  existing: FieldTransformation | null;
  onDone: () => void;
}) {
  const isEdit = existing !== null;
  const createTransformation = useMutation(
    api.transformations.createFieldTransformation,
  );
  const updateTransformation = useMutation(
    api.transformations.updateFieldTransformation,
  );

  const form = useForm({
    defaultValues: {
      name: existing?.name ?? "",
      field: existing?.field ?? ("" as FieldName | ""),
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

  const getAvailableStrategies = (fieldName: FieldName) => {
    const fieldType = getFieldType(fieldName);
    return STRATEGY_OPTIONS.filter((s) => {
      if (s.value === "random_offset") return fieldType === "number";
      if (s.value === "random_string") return fieldType === "string";
      return true;
    });
  };

  const resetParams = () =>
    form.setFieldValue("params", {
      value: "",
      minOffset: 0,
      maxOffset: 0,
      length: 8,
      charset: "alphanumeric",
      template: "",
    });

  const renderParameterFields = (
    strategy: TransformationStrategy,
    fieldName: FieldName,
  ) => {
    const fieldType = getFieldType(fieldName);
    switch (strategy) {
      case "static_value":
        return (
          <form.Field
            name="params.value"
            validators={{
              onChange: ({ value }) =>
                validateStaticValue(String(value ?? ""), fieldName),
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  Static value (
                  {fieldType === "number"
                    ? "number"
                    : fieldType === "array"
                      ? "JSON array"
                      : "string"}
                  )
                </Label>
                {fieldType === "array" ? (
                  <Textarea
                    id={field.name}
                    placeholder='["value1", "value2"]'
                    value={String(field.state.value ?? "")}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={fieldType === "number" ? "number" : "text"}
                    step={fieldType === "number" ? "any" : undefined}
                    placeholder={fieldType === "number" ? "123.45" : "REDACTED"}
                    value={String(field.state.value ?? "")}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
        );
      case "random_offset":
        return (
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="params.minOffset">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Min offset</Label>
                  <Input
                    id={field.name}
                    type="number"
                    step="any"
                    placeholder="-0.0018"
                    value={String(field.state.value ?? "")}
                    onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="params.maxOffset">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Max offset</Label>
                  <Input
                    id={field.name}
                    type="number"
                    step="any"
                    placeholder="0.0018"
                    value={String(field.state.value ?? "")}
                    onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>
          </div>
        );
      case "random_string":
        return (
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="params.length">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>String length</Label>
                  <Input
                    id={field.name}
                    type="number"
                    placeholder="8"
                    value={String(field.state.value ?? "")}
                    onChange={(e) => field.handleChange(parseInt(e.target.value) || 8)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="params.charset">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Character set</Label>
                  <Select
                    onValueChange={(v) => field.handleChange(v)}
                    value={String(field.state.value ?? "alphanumeric")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a character set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alphanumeric">Alphanumeric</SelectItem>
                      <SelectItem value="alpha">Letters only</SelectItem>
                      <SelectItem value="numeric">Numbers only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
          </div>
        );
      case "merge_data":
        return (
          <form.Field name="params.template">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Template</Label>
                <Input
                  id={field.name}
                  placeholder="e.g., {city}-{stateCode}"
                  value={String(field.state.value ?? "")}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <p className="text-muted-foreground text-xs">
                  Use {`{fieldName}`} to reference other dispatch fields.
                </p>
              </div>
            )}
          </form.Field>
        );
      default:
        return null;
    }
  };

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
                    <SelectItem key={f} value={f}>
                      {f} ({getFieldType(f)})
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
                onChange: ({ value }) => (!value ? "Strategy is required" : undefined),
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
                          selectedField ? "Select a strategy" : "Select a field first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedField &&
                        getAvailableStrategies(selectedField as FieldName).map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label} — {o.description}
                          </SelectItem>
                        ))}
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
                {renderParameterFields(
                  strategy as TransformationStrategy,
                  fieldName as FieldName,
                )}
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
