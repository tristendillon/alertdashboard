"use client";

import type { Table } from "@tanstack/react-table";
import { Download, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import {
  DataTableActionBar,
  DataTableActionBarAction,
  DataTableActionBarSelection,
} from "@/components/data-table/data-table-action-bar";
import { Separator } from "@/components/ui/separator";
import { exportTableToCSV } from "@/lib/export";

const actions = ["export", "delete"] as const;
type Action = (typeof actions)[number];

interface TableActionBarProps<TData> {
  table: Table<TData>;
  onDelete?: (ids: string[]) => Promise<void>;
  entityName?: string;
}

export function TableActionBar<TData>({
  table,
  onDelete,
  entityName = "items",
}: TableActionBarProps<TData>) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const [isPending, startTransition] = React.useTransition();
  const [currentAction, setCurrentAction] = React.useState<Action | null>(null);

  const getIsActionPending = React.useCallback(
    (action: Action) => isPending && currentAction === action,
    [isPending, currentAction],
  );

  const onExport = React.useCallback(() => {
    setCurrentAction("export");
    startTransition(() => {
      const timestamp = new Date().toISOString().split("T")[0];
      exportTableToCSV(table, {
        excludeColumns: ["select", "actions"],
        onlySelected: true,
        filename: `${entityName}-${timestamp}.csv`,
      });
      toast.success(`Exported ${rows.length} ${entityName} to CSV`);
    });
  }, [table, entityName, rows.length]);

  const onDeleteItems = React.useCallback(() => {
    if (!onDelete) return;

    setCurrentAction("delete");
    startTransition(async () => {
      try {
        // Extract IDs from rows - assuming each row has _id or id field
        const ids = rows
          .map((row) => {
            const data = row.original as Record<string, string>;
            return data._id || data.id;
          })
          .filter(Boolean);

        if (ids.length === 0) {
          toast.error("No valid items selected for deletion");
          return;
        }

        await onDelete(ids);
        table.toggleAllRowsSelected(false);
        toast.success(`Deleted ${ids.length} ${entityName}`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "An error occurred";
        toast.error(`Failed to delete ${entityName}: ${message}`);
      }
    });
  }, [rows, table, onDelete, entityName]);

  return (
    <DataTableActionBar table={table} visible={rows.length > 0}>
      <DataTableActionBarSelection table={table} />
      <Separator
        orientation="vertical"
        className="hidden data-[orientation=vertical]:h-5 sm:block"
      />
      <div className="flex items-center gap-1.5">
        <DataTableActionBarAction
          size="icon"
          tooltip={`Export ${entityName}`}
          isPending={getIsActionPending("export")}
          onClick={onExport}
        >
          <Download />
        </DataTableActionBarAction>
        {onDelete && (
          <DataTableActionBarAction
            size="icon"
            tooltip={`Delete ${entityName}`}
            isPending={getIsActionPending("delete")}
            onClick={onDeleteItems}
          >
            <Trash2 />
          </DataTableActionBarAction>
        )}
      </div>
    </DataTableActionBar>
  );
}
