"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldInfo } from "@/components/ui/field-info";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

// View tokens are create-only (no update mutation); the token is generated
// server-side, so the form collects just a name.
export function ViewTokenForm({ onDone }: { onDone: () => void }) {
  const createViewToken = useMutation(api.viewToken.createViewToken);

  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      try {
        await createViewToken({ name: value.name.trim() });
        toast.success("View token created");
        onDone();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create view token",
        );
      }
    },
  });

  return (
    <>
      <SheetHeader>
        <SheetTitle>New view token</SheetTitle>
        <SheetDescription>
          Creates a token for a kiosk/display. The token value is generated
          automatically.
        </SheetDescription>
      </SheetHeader>

      <form
        id="view-token-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="flex-1 space-y-4 overflow-y-auto px-4"
      >
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => (!value.trim() ? "Name is required" : undefined),
          }}
        >
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Name</Label>
              <Input
                id={field.name}
                placeholder="e.g., Station 1 Lobby"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              <FieldInfo field={field} />
            </div>
          )}
        </form.Field>
      </form>

      <SheetFooter>
        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              form="view-token-form"
              disabled={!canSubmit}
            >
              {isSubmitting ? "Creating..." : "Create view token"}
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
