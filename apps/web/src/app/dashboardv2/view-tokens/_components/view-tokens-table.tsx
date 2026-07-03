"use client";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { CopyCell } from "@/components/ui/copy-cell";
import { TimestampCell } from "@/components/ui/timestamp-cell";
import { ActionCell } from "@/components/ui/action-cell";
import { Cell, CellContent } from "@/components/ui/cell";
import { Checkbox } from "@/components/ui/checkbox";
import { useDataTable } from "@/hooks/use-data-table";
import { Modals } from "@/lib/enums";
import type { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type { ViewToken } from "@sizeupdashboard/convex/src/api/schema.js";
import type { ColumnDef } from "@tanstack/react-table";
import { usePreloadedQuery, type Preloaded } from "convex/react";
import { useMemo } from "react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { TableActionBar } from "@/components/table-action-bar";

interface ViewTokensTableProps {
  preloaded: Preloaded<typeof api.viewToken.paginatedViewTokens>;
}

export function ViewTokensTable({ preloaded }: ViewTokensTableProps) {
  const data = usePreloadedQuery(preloaded);
  console.log(data);
  const columns = useMemo<ColumnDef<ViewToken>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-0.5"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      {
        accessorKey: "name",
        header: "Name",
        minSize: 150,
        enableResizing: true,
        enableSorting: false,
        cell: ({ row }) => {
          return (
            <Cell>
              <CellContent>{row.original.name}</CellContent>
            </Cell>
          );
        },
      },
      {
        accessorKey: "token",
        header: "Token",
        minSize: 200,
        enableResizing: true,
        enableSorting: false,
        cell: ({ row }) => {
          return <CopyCell value={row.original.token} />;
        },
      },
      {
        accessorKey: "_creationTime",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created At" />
        ),
        size: 140,
        enableResizing: true,
        cell: ({ row }) => {
          return (
            <TimestampCell
              timestamp={row.original._creationTime}
              format="short-12h"
            />
          );
        },
        sortDescFirst: true,
      },
      {
        id: "actions",
        header: "",
        size: 50,
        enableResizing: true,
        cell: ({ row }) => {
          return (
            <ActionCell
              modalType={Modals.VIEW_TOKEN}
              itemId={row.original._id}
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [],
  );

  const { table } = useDataTable({
    data: data.data,
    columns,
    pageCount: data.pagination.totalPages,
    enableAdvancedFilter: true,
    initialState: {
      sorting: [{ id: "_creationTime", desc: true }],
    },
    getRowId: (originalRow) => originalRow._id,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <DataTable
      table={table}
      actionBar={<TableActionBar table={table} entityName="view tokens" />}
    >
      <DataTableToolbar table={table}>
        <DataTableSortList table={table} />
      </DataTableToolbar>
    </DataTable>
  );
}
