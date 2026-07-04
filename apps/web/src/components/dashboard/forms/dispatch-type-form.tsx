"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type { DispatchType } from "@sizeupdashboard/convex/src/api/schema.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldInfo } from "@/components/ui/field-info";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { DISPATCH_GROUPS } from "@/lib/dispatch-groups";

interface DispatchTypeFormProps {
  id?: string;
  onDone: () => void;
}

export function DispatchTypeForm({ id, onDone }: DispatchTypeFormProps) {
  // Edit hydration: no getById query exists, so read the (small) full list and
  // find the row. Skipped for create.
  const all = useQuery(api.dispatches.getDispatchTypes, id ? {} : "skip");
  const existing = id ? all?.find((d) => d._id === id) : null;

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
          <SheetTitle>Dispatch type not found</SheetTitle>
        </SheetHeader>
        <Button className="mt-4" variant="outline" onClick={onDone}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <DispatchTypeFormInner
      existing={existing ?? null}
      onDone={onDone}
    />
  );
}

function DispatchTypeFormInner({
  existing,
  onDone,
}: {
  existing: DispatchType | null;
  onDone: () => void;
}) {
  const isEdit = existing !== null;
  const createDispatchType = useMutation(api.customization.createDispatchType);
  const updateDispatchType = useMutation(api.customization.updateDispatchType);

  const form = useForm({
    defaultValues: {
      code: existing?.code ?? "",
      group: existing?.group ?? ("" as DispatchType["group"] | ""),
      name: existing?.name ?? "",
      default: existing?.default ?? false,
    },
    onSubmit: async ({ value }) => {
      if (!value.code.trim()) {
        toast.error("Code is required");
        return;
      }
      if (!value.group) {
        toast.error("Group is required");
        return;
      }
      const payload = {
        code: value.code.trim(),
        group: value.group,
        name: value.name.trim() || undefined,
        default: value.default,
      };
      try {
        if (isEdit && existing) {
          await updateDispatchType({ id: existing._id, diff: payload });
          toast.success("Dispatch type updated");
        } else {
          await createDispatchType(payload);
          toast.success("Dispatch type created");
        }
        onDone();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Save failed");
      }
    },
  });

  return (
    <>
      <SheetHeader>
        <SheetTitle>{isEdit ? "Edit dispatch type" : "New dispatch type"}</SheetTitle>
        <SheetDescription>
          Codes map incoming dispatch strings to a group. One type should be the
          default for unmatched codes.
        </SheetDescription>
      </SheetHeader>

      <form
        id="dispatch-type-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="flex-1 space-y-4 overflow-y-auto px-4"
      >
        <form.Field
          name="code"
          validators={{
            onChange: ({ value }) => (!value.trim() ? "Code is required" : undefined),
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Code</Label>
              <Input
                id={field.name}
                placeholder="e.g., FIRE1"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        <form.Field
          name="group"
          validators={{
            onChange: ({ value }) => (!value ? "Group is required" : undefined),
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Group</Label>
              <Select
                value={field.state.value || undefined}
                onValueChange={(v) => field.handleChange(v as DispatchType["group"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {DISPATCH_GROUPS.map((g) => (
                    <SelectItem key={g} value={g} className="capitalize">
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>

        <form.Field name="name">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Name (optional)</Label>
              <Input
                id={field.name}
                placeholder="e.g., Structure Fire"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="default">
          {(field) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id={field.name}
                checked={field.state.value}
                onCheckedChange={(v) => field.handleChange(!!v)}
              />
              <Label htmlFor={field.name} className="cursor-pointer">
                Default type (used for unmatched dispatch codes)
              </Label>
            </div>
          )}
        </form.Field>
      </form>

      <SheetFooter>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" form="dispatch-type-form" disabled={!canSubmit}>
              {isSubmitting
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save changes"
                  : "Create dispatch type"}
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
