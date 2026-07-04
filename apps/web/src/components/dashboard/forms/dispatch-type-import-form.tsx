"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  .min(1, "The CSV has no data rows")
  .max(2000, "Too many dispatch types (max 2000)")
  .superRefine((rows, ctx) => {
    if (!rows.some((r) => r.default)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one row must set default to "true"',
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

type ParsedRows = z.infer<typeof importSchema>;

const TRUTHY = new Set(["true", "1", "yes", "y"]);
const REQUIRED_HEADERS = ["code", "group"] as const;
type Header = "code" | "group" | "name" | "default";

// Minimal RFC-4180-ish CSV parser (quoted fields, escaped quotes, CRLF) — keeps
// commas inside a quoted `name` intact without pulling in a CSV dependency.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\r") {
      // ignore; handled by \n
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Drop rows that are entirely empty (e.g. a trailing newline).
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function rowsToDispatchTypes(csv: string): {
  data?: ParsedRows;
  error?: string;
} {
  const grid = parseCsv(csv);
  if (grid.length < 2) {
    return { error: "CSV needs a header row and at least one data row." };
  }
  const headers = grid[0].map((h) => h.trim().toLowerCase());
  for (const required of REQUIRED_HEADERS) {
    if (!headers.includes(required)) {
      return { error: `Missing required column "${required}".` };
    }
  }
  const idx = (name: Header) => headers.indexOf(name);
  const rows = grid.slice(1).map((cols) => {
    const name = idx("name") >= 0 ? (cols[idx("name")] ?? "").trim() : "";
    const rawDefault =
      idx("default") >= 0 ? (cols[idx("default")] ?? "").trim().toLowerCase() : "";
    return {
      code: (cols[idx("code")] ?? "").trim(),
      group: (cols[idx("group")] ?? "").trim().toLowerCase(),
      name: name || undefined,
      default: TRUTHY.has(rawDefault),
    };
  });

  const result = importSchema.safeParse(rows);
  if (!result.success) {
    return { error: result.error.issues.map((i) => i.message).join("; ") };
  }
  return { data: result.data };
}

export function DispatchTypeImportForm({ onDone }: { onDone: () => void }) {
  const importDispatchTypes = useMutation(api.customization.importDispatchTypes);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<ParsedRows | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFile = async (file: File | undefined) => {
    setError(null);
    setPending(null);
    setFileName(file?.name ?? null);
    if (!file) return;
    const text = await file.text();
    const { data, error: parseError } = rowsToDispatchTypes(text);
    if (parseError) {
      setError(parseError);
      return;
    }
    setPending(data ?? null);
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
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>Import dispatch types</SheetTitle>
        <SheetDescription>
          Upload a CSV with a header row of{" "}
          <code>code, group, name, default</code>. This{" "}
          <strong>replaces all existing dispatch types</strong> — it is not a
          merge. Rules are re-linked to the new types by code.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-3 overflow-y-auto px-4">
        <div className="space-y-2">
          <Label htmlFor="import-csv">CSV file</Label>
          <Input
            id="import-csv"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          {fileName && (
            <p className="text-muted-foreground text-xs">Selected: {fileName}</p>
          )}
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}
        {pending && !error && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            {pending.length} dispatch type{pending.length === 1 ? "" : "s"} ready
            to import.
          </p>
        )}

        <div className="text-muted-foreground space-y-1 text-xs">
          <p>
            Required columns: <code>code</code>, <code>group</code>. Optional:{" "}
            <code>name</code>, <code>default</code>.
          </p>
          <p>Groups: {DISPATCH_GROUPS.join(", ")}.</p>
          <p>
            Exactly one row should set <code>default</code> to{" "}
            <code>true</code>.
          </p>
          <pre className="bg-muted mt-1 overflow-x-auto rounded-md p-2 font-mono">
            {`code,group,name,default\nFIRE1,fire,Structure Fire,false\nOTHER,other,,true`}
          </pre>
        </div>
      </div>

      <SheetFooter>
        <Button
          type="button"
          disabled={!pending || !!error}
          onClick={() => setConfirmOpen(true)}
        >
          Review import
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </SheetFooter>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => !submitting && setConfirmOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace all dispatch types?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes every existing dispatch type and inserts the{" "}
              {pending?.length ?? 0} from your CSV. Transformation rules are
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
