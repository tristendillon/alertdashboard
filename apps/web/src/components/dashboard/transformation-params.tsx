"use client";

import type { ReactNode } from "react";
import type { AnyFieldApi } from "@tanstack/react-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldInfo } from "@/components/ui/field-info";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TemplateInput,
  type TemplateField,
} from "@/components/ui/template-input";
import {
  getFieldType,
  validateStaticValue,
  type FieldName,
  type TransformationStrategy,
} from "@/lib/transformations/fields";

// Loose structural view of the TanStack form used by the param editors. The
// caller casts its real form to this — field names are plain strings here.
export interface TransformationParamsForm {
  Field: (props: {
    name: string;
    validators?: {
      onChange?: (args: { value: unknown }) => string | undefined;
    };
    children: (field: AnyFieldApi) => ReactNode;
  }) => ReactNode;
}

interface TransformationParamsProps {
  form: TransformationParamsForm;
  basePath: string;
  strategy: TransformationStrategy;
  field: FieldName;
  fieldsForTemplate: TemplateField[];
}

/**
 * Per-strategy parameter editors for a field transformation, bound to a
 * TanStack form at `basePath` (e.g. "params"). Extracted from
 * field-transformation-form so the same editors can be reused elsewhere.
 */
export function TransformationParams({
  form,
  basePath,
  strategy,
  field,
  fieldsForTemplate,
}: TransformationParamsProps) {
  const fieldType = getFieldType(field);
  const Field = form.Field;

  switch (strategy) {
    case "static_value":
      return (
        <Field
          name={`${basePath}.value`}
          validators={{
            onChange: ({ value }) =>
              validateStaticValue(String(value ?? ""), field),
          }}
        >
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>
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
                  id={f.name}
                  placeholder='["value1", "value2"]'
                  value={String(f.state.value ?? "")}
                  onChange={(e) => f.handleChange(e.target.value)}
                  onBlur={f.handleBlur}
                />
              ) : (
                <Input
                  id={f.name}
                  type={fieldType === "number" ? "number" : "text"}
                  step={fieldType === "number" ? "any" : undefined}
                  placeholder={fieldType === "number" ? "123.45" : "REDACTED"}
                  value={String(f.state.value ?? "")}
                  onChange={(e) => f.handleChange(e.target.value)}
                  onBlur={f.handleBlur}
                />
              )}
              <FieldInfo field={f} />
            </div>
          )}
        </Field>
      );

    case "random_offset":
      return (
        <div className="grid grid-cols-2 gap-4">
          <Field name={`${basePath}.minOffset`}>
            {(f) => (
              <div className="space-y-2">
                <Label htmlFor={f.name}>Min offset</Label>
                <Input
                  id={f.name}
                  type="number"
                  step="any"
                  placeholder="-0.0018"
                  value={String(f.state.value ?? "")}
                  onChange={(e) =>
                    f.handleChange(parseFloat(e.target.value) || 0)
                  }
                  onBlur={f.handleBlur}
                />
              </div>
            )}
          </Field>
          <Field name={`${basePath}.maxOffset`}>
            {(f) => {
              const maxOffset = Number(f.state.value ?? 0);
              const meters = Math.round(Math.abs(maxOffset) * 111000);
              return (
                <div className="space-y-2">
                  <Label htmlFor={f.name}>Max offset</Label>
                  <Input
                    id={f.name}
                    type="number"
                    step="any"
                    placeholder="0.0018"
                    value={String(f.state.value ?? "")}
                    onChange={(e) =>
                      f.handleChange(parseFloat(e.target.value) || 0)
                    }
                    onBlur={f.handleBlur}
                  />
                  <p className="text-muted-foreground text-xs">
                    ±{meters} m on the map
                  </p>
                </div>
              );
            }}
          </Field>
        </div>
      );

    case "random_string":
      return (
        <div className="grid grid-cols-2 gap-4">
          <Field name={`${basePath}.length`}>
            {(f) => (
              <div className="space-y-2">
                <Label htmlFor={f.name}>String length</Label>
                <Input
                  id={f.name}
                  type="number"
                  placeholder="8"
                  value={String(f.state.value ?? "")}
                  onChange={(e) =>
                    f.handleChange(parseInt(e.target.value) || 8)
                  }
                  onBlur={f.handleBlur}
                />
              </div>
            )}
          </Field>
          <Field name={`${basePath}.charset`}>
            {(f) => (
              <div className="space-y-2">
                <Label htmlFor={f.name}>Character set</Label>
                <Select
                  onValueChange={(v) => f.handleChange(v)}
                  value={String(f.state.value ?? "alphanumeric")}
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
          </Field>
        </div>
      );

    case "merge_data":
      return (
        <Field name={`${basePath}.template`}>
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Template</Label>
              <TemplateInput
                id={f.name}
                value={String(f.state.value ?? "")}
                onChange={(v) => f.handleChange(v)}
                fields={fieldsForTemplate}
                placeholder="e.g., {city}-{stateCode}"
              />
              <p className="text-muted-foreground text-xs">
                Type {"{"} to reference other dispatch fields.
              </p>
            </div>
          )}
        </Field>
      );

    case "remove_field":
      return (
        <p className="text-muted-foreground bg-muted rounded-md px-3 py-2 text-sm">
          {field === "location"
            ? "The dispatch will not appear on the public map at all."
            : "Removed entirely for public viewers. Nothing is shown in its place."}
        </p>
      );

    default:
      return null;
  }
}
