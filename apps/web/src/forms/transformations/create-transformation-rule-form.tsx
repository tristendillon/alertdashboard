"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { useQuery } from "@/hooks/use-query";
import { z } from "zod";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FieldInfo } from "@/components/ui/field-info";
import { Badge } from "@/components/ui/badge";
import type { Id } from "@sizeupdashboard/convex/src/api/_generated/dataModel.js";
import { Checkbox } from "@/components/ui/checkbox";
import type { TransformationRule } from "@sizeupdashboard/convex/src/api/schema.js";

interface TransformationRuleFormProps {
  mode: "create" | "edit";
  rule: TransformationRule | null;
  open: boolean;
  onCloseAction: () => void;
}

const transformationRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  dispatchTypeRegex: z.string(),
  keywords: z.array(z.string()),
  keywordInput: z.string(),
  transformations: z
    .array(z.string())
    .min(1, "At least one transformation must be selected"),
});

export function TransformationRuleForm({
  mode,
  rule,
  open,
  onCloseAction,
}: TransformationRuleFormProps) {
  const createRule = useMutation(api.transformations.createTransformationRule);
  const updateRule = useMutation(api.transformations.updateTransformationRule);

  // Get available field transformations
  const { data: transformations } = useQuery(
    api.transformations.getFieldTransformations,
    {},
  );

  const form = useForm({
    validators: {
      onSubmit: transformationRuleSchema,
    },
    defaultValues: {
      name: rule?.name ?? "",
      dispatchTypeRegex: rule?.dispatchTypeRegex ?? "",
      keywords: rule?.keywords ?? ([] as string[]),
      keywordInput: "",
      transformations: rule?.transformations ?? ([] as string[]),
    },
    onSubmit: async ({ value }) => {
      if (mode === "edit" && rule) {
        await updateRule({
          id: rule._id,
          name: value.name,
          dispatchTypeRegex: value.dispatchTypeRegex,
          keywords: value.keywords,
          dispatchTypes: [], // For now, keeping this empty
          transformations:
            value.transformations as Id<"fieldTransformations">[],
        });
      } else {
        await createRule({
          name: value.name,
          dispatchTypeRegex: value.dispatchTypeRegex,
          keywords: value.keywords,
          dispatchTypes: [], // For now, keeping this empty
          transformations:
            value.transformations as Id<"fieldTransformations">[],
        });
      }
      onCloseAction();
    },
  });

  const handleAddKeyword = (keyword: string) => {
    if (keyword.trim()) {
      form.setFieldValue("keywords", (prev) =>
        prev.includes(keyword.trim()) ? prev : [...prev, keyword.trim()],
      );
      form.setFieldValue("keywordInput", "");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    form.setFieldValue("keywords", (prev) => prev.filter((k) => k !== keyword));
  };

  const handleTransformationToggle = (transformationId: string) => {
    form.setFieldValue("transformations", (prev) =>
      prev.includes(transformationId)
        ? prev.filter((id) => id !== transformationId)
        : [...prev, transformationId],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onCloseAction}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? "Edit Transformation Rule"
              : "Create Transformation Rule"}
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
                !value ? "Rule name is required" : undefined,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Rule Name</Label>
                <Input
                  id={field.name}
                  placeholder="e.g., Medical Privacy Rule, Fire Department Obfuscation"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <FieldInfo field={field} />
              </div>
            )}
          </form.Field>

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-base font-medium">Matching Criteria</h3>
            <p className="text-muted-foreground text-sm">
              Define which dispatches this rule should apply to. At least one
              criteria must match.
            </p>

            <form.Field name="dispatchTypeRegex">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    Dispatch Type Regex Pattern
                  </Label>
                  <Input
                    id={field.name}
                    placeholder="e.g., ^(MEDICAL|EMS).* or .*FIRE.*"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  <p className="text-muted-foreground text-xs">
                    Regular expression to match against dispatch types (case
                    insensitive)
                  </p>
                  <FieldInfo field={field} />
                </div>
              )}
            </form.Field>

            <div className="space-y-2">
              <Label>Keywords</Label>
              <form.Field name="keywordInput">
                {(field) => (
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., medical, ambulance, fire"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onKeyUp={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddKeyword(field.state.value);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => handleAddKeyword(field.state.value)}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </form.Field>
              <form.Subscribe selector={(state) => [state.values.keywords]}>
                {([keywords]) =>
                  keywords.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {keywords.map((keyword) => (
                        <Badge
                          key={keyword}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(keyword)}
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
              <p className="text-muted-foreground text-xs">
                Dispatches containing any of these keywords will match this rule
              </p>
            </div>
          </div>

          <form.Subscribe selector={(state) => [state.values.transformations]}>
            {([selectedTransformations]) => (
              <form.Field
                name="transformations"
                validators={{
                  onChange: ({ value }) =>
                    !value || value.length === 0
                      ? "At least one transformation must be selected"
                      : undefined,
                }}
              >
                {(field) => (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-base font-medium">
                      Applied Transformations
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Select which field transformations to apply when this rule
                      matches
                    </p>

                    {!transformations || transformations.length === 0 ? (
                      <div className="text-muted-foreground py-4 text-center">
                        No field transformations available. Create some
                        transformations first.
                      </div>
                    ) : (
                      <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto">
                        {transformations.map((transformation) => (
                          <div
                            key={transformation._id}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedTransformations.includes(
                                  transformation._id,
                                )}
                                onCheckedChange={() => {
                                  handleTransformationToggle(
                                    transformation._id,
                                  );
                                }}
                                className="rounded"
                              />
                              <div>
                                <div className="font-medium">
                                  {transformation.name}
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  {transformation.field} •{" "}
                                  {transformation.strategy}
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {transformation.strategy}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedTransformations.length > 0 && (
                      <div className="text-muted-foreground text-sm">
                        Selected {selectedTransformations.length} transformation
                        {selectedTransformations.length !== 1 ? "s" : ""}
                      </div>
                    )}
                    <FieldInfo field={field} />
                  </div>
                )}
              </form.Field>
            )}
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
                      ? "Update Rule"
                      : "Create Rule"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
