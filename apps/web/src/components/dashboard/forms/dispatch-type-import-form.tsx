"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { DISPATCH_GROUPS } from "@/lib/dispatch-groups";

// Mirrors the importDispatchTypes backend guards so errors surface before submit.
const importSchema = z
  .array(
    z.object({
      code: z.string().min(1, "code is required"),
      group: z.enum(DISPATCH_GROUPS),
      name: z.string().optional(),
      default: z.boolean().optional(),
    }),
  )
  .min(1, "Provide at least one dispatch type")
  .max(2000, "Too many dispatch types (max 2000)")
  .superRefine((rows, ctx) => {
    if (!rows.some((r) => r.default)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one dispatch type must have \"default\": true",
      });
    }
    const codes = rows.map((r) => r.code.toLowerCase());
    if (new Set(codes).size !== codes.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Duplicate codes are not allowed",
      });
    }
  });

const EXAMPLE = JSON.stringify(
  [
    { code: "FIRE1", group: "fire", name: "Structure Fire", default: false },
    { code: "OTHER", group: "other", default: true },
  ],
  null,
  2,
);

type ParsedRows = z.infer<typeof importSchema>;

export function DispatchTypeImportForm({ onDone }: { onDone: () => void }) {
  const importDispatchTypes = useMutation(api.customization.importDispatchTypes);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<ParsedRows | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    setError(null);
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      setError("Not valid JSON.");
      return;
    }
    const result = importSchema.safeParse(json);
    if (!result.success) {
      setError(result.error.issues.map((i) => i.message).join("; "));
      return;
    }
    setPending(result.data);
  };

  const confirmImport = async () => {
    if (!pending) return;
    setSubmitting(true);
    try {
      const res = await importDispatchTypes({ dispatchTypes: pending });
      const dropped = Object.entries(res.droppedByRule);
      toast.success(
        `Imported ${res.created} dispatch types (${res.deleted} replaced).`,
        dropped.length
          ? {
              description: `Rules with dropped codes: ${dropped
                .map(([rule, codes]) => `${rule} (${codes.join(", ")})`)
                .join("; ")}`,
            }
          : undefined,
      );
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setSubmitting(false);
      setPending(null);
    }
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>Import dispatch types</SheetTitle>
        <SheetDescription>
          Paste a JSON array of{" "}
          <code>{`{ code, group, name?, default? }`}</code>. This{" "}
          <strong>replaces all existing dispatch types</strong> — it is not a
          merge. Rules are re-linked to the new types by code.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-3 overflow-y-auto px-4">
        <div className="space-y-2">
          <Label htmlFor="import-json">JSON</Label>
          <Textarea
            id="import-json"
            className="min-h-[240px] font-mono text-xs"
            placeholder={EXAMPLE}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
          />
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <p className="text-muted-foreground text-xs">
          Groups: {DISPATCH_GROUPS.join(", ")}. Exactly one row should set{" "}
          <code>default: true</code>.
        </p>
      </div>

      <SheetFooter>
        <Button type="button" onClick={validate} disabled={!text.trim()}>
          Review import
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </SheetFooter>

      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace all dispatch types?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes every existing dispatch type and inserts the{" "}
              {pending?.length ?? 0} you pasted. Transformation rules are
              re-linked by code; any rule referencing a code not in this import
              loses that link. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmImport();
              }}
              disabled={submitting}
            >
              {submitting ? "Importing..." : "Replace all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
