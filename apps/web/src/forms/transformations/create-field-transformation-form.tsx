"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { z } from "zod";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { FieldTransformation } from "@sizeupdashboard/convex/src/api/schema.js";

interface FieldTransformationFormProps {
  mode: "create" | "edit";
  transformation: FieldTransformation | null;
  open: boolean;
  onCloseAction: () => void;
}

type TransformationStrategy =
  | "static_value"
  | "random_offset"
  | "random_string"
  | "merge_data";

// Zod schemas for field types
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

const FIELD_OPTIONS: Array<{
  field: FieldName;
  label: string;
  schema: z.ZodTypeAny;
}> = [
  { field: "address", label: "Address", schema: fieldSchemas.address },
  { field: "address2", label: "Address 2", schema: fieldSchemas.address2 },
  { field: "city", label: "City", schema: fieldSchemas.city },
  { field: "stateCode", label: "State", schema: fieldSchemas.stateCode },
  { field: "narrative", label: "Narrative", schema: fieldSchemas.narrative },
  {
    field: "location.lat",
    label: "Latitude",
    schema: fieldSchemas["location.lat"],
  },
  {
    field: "location.lng",
    label: "Longitude",
    schema: fieldSchemas["location.lng"],
  },
  { field: "unitCodes", label: "Unit Codes", schema: fieldSchemas.unitCodes },
  {
    field: "type",
    label: "Dispatch Type",
    schema: fieldSchemas.type,
  },
  {
    field: "dispatchId",
    label: "Dispatch ID",
    schema: fieldSchemas.dispatchId,
  },
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

// Helper function to get field type
const getFieldType = (fieldName: FieldName): "string" | "number" | "array" => {
  const schema = fieldSchemas[fieldName];
  if (schema instanceof z.ZodString) return "string";
  if (schema instanceof z.ZodNumber) return "number";
  if (schema instanceof z.ZodArray) return "array";
  return "string"; // fallback
};

// Helper function to validate static value based on field type
const validateStaticValue = (value: string, fieldName: FieldName) => {
  const fieldType = getFieldType(fieldName);

  switch (fieldType) {
    case "number": {
      const num = Number(value);
      if (isNaN(num)) {
        return `Value must be a valid number for field ${fieldName}`;
      }
      break;
    }
    case "array":
      try {
        JSON.parse(value);
      } catch {
        return `Value must be valid JSON array for field ${fieldName}`;
      }
      break;
    case "string":
    default:
      // Strings are always valid
      break;
  }
  return undefined;
};

// Dynamic transformation schema based on field and strategy
const createTransformationSchema = (
  fieldName: FieldName,
  strategy: TransformationStrategy,
) => {
  const fieldType = getFieldType(fieldName);

  const baseSchema = z.object({
    name: z.string().min(1, "Name is required"),
    field: z.string().min(1, "Field is required"),
    strategy: z.enum([
      "static_value",
      "random_offset",
      "random_string",
      "merge_data",
    ]),
  });

  // Define params schema based on strategy and field type
  let paramsSchema: z.ZodTypeAny;

  switch (strategy) {
    case "static_value":
      if (fieldType === "number") {
        paramsSchema = z.object({
          value: z.string().refine((val) => !isNaN(Number(val)), {
            message: "Value must be a valid number",
          }),
          minOffset: z.number().optional(),
          maxOffset: z.number().optional(),
          length: z.number().optional(),
          charset: z.string().optional(),
          template: z.string().optional(),
        });
      } else if (fieldType === "array") {
        paramsSchema = z.object({
          value: z.string().refine(
            (val) => {
              try {
                JSON.parse(val);
                return true;
              } catch {
                return false;
              }
            },
            {
              message: "Value must be valid JSON array",
            },
          ),
          minOffset: z.number().optional(),
          maxOffset: z.number().optional(),
          length: z.number().optional(),
          charset: z.string().optional(),
          template: z.string().optional(),
        });
      } else {
        paramsSchema = z.object({
          value: z.string(),
          minOffset: z.number().optional(),
          maxOffset: z.number().optional(),
          length: z.number().optional(),
          charset: z.string().optional(),
          template: z.string().optional(),
        });
      }
      break;

    case "random_offset":
      if (fieldType !== "number") {
        throw new Error(
          `Random offset can only be applied to numeric fields, but ${fieldName} is ${fieldType}`,
        );
      }
      paramsSchema = z.object({
        value: z.string().optional(),
        minOffset: z.number(),
        maxOffset: z.number(),
        length: z.number().optional(),
        charset: z.string().optional(),
        template: z.string().optional(),
      });
      break;

    case "random_string":
      if (fieldType !== "string") {
        throw new Error(
          `Random string can only be applied to string fields, but ${fieldName} is ${fieldType}`,
        );
      }
      paramsSchema = z.object({
        value: z.string().optional(),
        minOffset: z.number().optional(),
        maxOffset: z.number().optional(),
        length: z.number().min(1),
        charset: z.enum(["alphanumeric", "alpha", "numeric"]),
        template: z.string().optional(),
      });
      break;

    case "merge_data":
      paramsSchema = z.object({
        value: z.string().optional(),
        minOffset: z.number().optional(),
        maxOffset: z.number().optional(),
        length: z.number().optional(),
        charset: z.string().optional(),
        template: z.string().min(1, "Template is required"),
      });
      break;

    default:
      paramsSchema = z.object({
        value: z.string(),
        minOffset: z.number(),
        maxOffset: z.number(),
        length: z.number(),
        charset: z.string(),
        template: z.string(),
      });
  }

  return baseSchema.extend({
    params: paramsSchema,
  });
};

export function FieldTransformationForm({
  mode,
  transformation,
  open,
  onCloseAction,
}: FieldTransformationFormProps) {
  const createTransformation = useMutation(
    api.transformations.createFieldTransformation,
  );
  const updateTransformation = useMutation(
    api.transformations.updateFieldTransformation,
  );

  const form = useForm({
    defaultValues: {
      name: transformation?.name ?? "",
      field: transformation?.field ?? ("" as FieldName),
      strategy: transformation?.strategy ?? ("" as TransformationStrategy),
      params: transformation?.params ?? {
        value: "",
        minOffset: 0,
        maxOffset: 0,
        length: 0,
        charset: "",
        template: "",
      },
    },
    onSubmit: async ({ value }) => {
      // Validate using dynamic schema
      try {
        if (value.field && value.strategy) {
          const schema = createTransformationSchema(
            value.field as FieldName,
            value.strategy,
          );
          schema.parse(value);
        }
      } catch (error) {
        console.error("Validation error:", error);
        return;
      }

      if (mode === "edit" && transformation) {
        await updateTransformation({
          id: transformation._id,
          name: value.name,
          field: value.field,
          strategy: value.strategy,
          params: value.params,
        });
      } else {
        await createTransformation({
          name: value.name,
          field: value.field,
          strategy: value.strategy,
          params: value.params,
        });
      }
      onCloseAction();
    },
  });

  // Get available strategies based on selected field
  const getAvailableStrategies = (fieldName: FieldName) => {
    const fieldType = getFieldType(fieldName);

    return STRATEGY_OPTIONS.filter((strategy) => {
      switch (strategy.value) {
        case "random_offset":
          return fieldType === "number";
        case "random_string":
          return fieldType === "string";
        case "static_value":
        case "merge_data":
          return true; // Available for all types
        default:
          return true;
      }
    });
  };

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
                validateStaticValue(value as string, fieldName),
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>
                  Static Value (
                  {fieldType === "number"
                    ? "number"
                    : fieldType === "array"
                      ? "JSON array"
                      : "string"}
                  )
                </Label>
                {fieldType === "array" ? (
                  <textarea
                    id={field.name}
                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder='["value1", "value2"]'
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={fieldType === "number" ? "number" : "text"}
                    step={fieldType === "number" ? "any" : undefined}
                    placeholder={fieldType === "number" ? "123.45" : "REDACTED"}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
                <FieldInfo field={field} />
                {fieldType === "number" && (
                  <p className="text-muted-foreground text-xs">
                    Enter a numeric value that will replace the original field
                    value
                  </p>
                )}
                {fieldType === "array" && (
                  <p className="text-muted-foreground text-xs">
                    Enter a valid JSON array that will replace the original
                    field value
                  </p>
                )}
              </div>
            )}
          </form.Field>
        );

      case "random_offset":
        if (fieldType !== "number") {
          return (
            <div className="rounded-md border bg-yellow-50 p-4 text-yellow-800">
              Random offset can only be applied to numeric fields. Selected
              field &quot;{fieldName}&quot; is of type &quot;{fieldType}&quot;.
            </div>
          );
        }
        return (
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="params.minOffset">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Min Offset</Label>
                  <Input
                    id={field.name}
                    type="number"
                    step="any"
                    placeholder="-0.0018"
                    value={field.state.value ?? ""}
                    onChange={(e) =>
                      field.handleChange(parseFloat(e.target.value) || 0)
                    }
                    onBlur={field.handleBlur}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
            <form.Field name="params.maxOffset">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Max Offset</Label>
                  <Input
                    id={field.name}
                    type="number"
                    step="any"
                    placeholder="0.0018"
                    value={field.state.value ?? ""}
                    onChange={(e) =>
                      field.handleChange(parseFloat(e.target.value) || 0)
                    }
                    onBlur={field.handleBlur}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
          </div>
        );

      case "random_string":
        if (fieldType !== "string") {
          return (
            <div className="rounded-md border bg-yellow-50 p-4 text-yellow-800">
              Random string can only be applied to string fields. Selected field
              &quot;{fieldName}&quot; is of type &quot;{fieldType}&quot;.
            </div>
          );
        }
        return (
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="params.length">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>String Length</Label>
                  <Input
                    id={field.name}
                    type="number"
                    placeholder="8"
                    value={field.state.value ?? ""}
                    onChange={(e) =>
                      field.handleChange(parseInt(e.target.value) || 8)
                    }
                    onBlur={field.handleBlur}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>
            <form.Field name="params.charset">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Character Set</Label>
                  <Select
                    onOpenChange={field.handleBlur}
                    onValueChange={(value) => field.handleChange(value)}
                    value={field.state.value ?? "alphanumeric"}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select a character set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alphanumeric">Alphanumeric</SelectItem>
                      <SelectItem value="alpha">Letters only</SelectItem>
                      <SelectItem value="numeric">Numbers only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldInfo field={field} />
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
                  placeholder="e.g., {city}-{statusCode} or {address}, {city}"
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <p className="text-muted-foreground text-xs">
                  Use {`{fieldName}`} syntax to reference other dispatch fields.
                  Available fields:{" "}
                  {FIELD_OPTIONS.map((f) => f.field).join(", ")}
                </p>
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onCloseAction}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? "Edit Field Transformation"
              : "Create Field Transformation"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
          className="space-y-6"
        >
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) =>
                !value ? "Name is required" : undefined,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Name</Label>
                <Input
                  id={field.name}
                  placeholder="e.g., Address Redaction, Location Offset 200m"
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
              onChange: ({ value }) =>
                !value ? "Field is required" : undefined,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Field</Label>
                <Select
                  onOpenChange={field.handleBlur}
                  onValueChange={(value) => {
                    field.handleChange(value as FieldName);
                    // Reset strategy when field changes
                    form.setFieldValue(
                      "strategy",
                      "" as TransformationStrategy,
                    );
                    form.setFieldValue("params", {
                      value: "",
                      minOffset: 0,
                      maxOffset: 0,
                      length: 8,
                      charset: "alphanumeric",
                      template: "",
                    });
                  }}
                  value={field.state.value}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a field" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_OPTIONS.map((option) => (
                      <SelectItem key={option.field} value={option.field}>
                        {option.field} ({getFieldType(option.field)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => [state.values.field]}>
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
                      onOpenChange={field.handleBlur}
                      onValueChange={(value) => {
                        field.handleChange(value as TransformationStrategy);
                        form.setFieldValue("params", {
                          value: "",
                          minOffset: 0,
                          maxOffset: 0,
                          length: 8,
                          charset: "alphanumeric",
                          template: "",
                        });
                      }}
                      value={field.state.value}
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
                          getAvailableStrategies(
                            selectedField as FieldName,
                          ).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label} - {option.description}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FieldInfo field={field} />
                    {selectedField && (
                      <p className="text-muted-foreground text-xs">
                        Available strategies for {selectedField} (
                        {getFieldType(selectedField as FieldName)} type)
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
            )}
          </form.Subscribe>

          <form.Subscribe
            selector={(state) => [state.values.strategy, state.values.field]}
          >
            {([strategy, fieldName]) =>
              strategy && fieldName ? (
                <div className="border-t pt-4">
                  <Label className="mb-4 block text-base font-medium">
                    Parameters
                  </Label>
                  {renderParameterFields(
                    strategy as TransformationStrategy,
                    fieldName as FieldName,
                  )}
                </div>
              ) : null
            }
          </form.Subscribe>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCloseAction}>
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit}>
                  {isSubmitting
                    ? mode === "edit"
                      ? "Updating..."
                      : "Creating..."
                    : mode === "edit"
                      ? "Update Transformation"
                      : "Create Transformation"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
