"use client";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { CopyCell } from "@/components/ui/copy-cell";
import { StatusCell } from "@/components/ui/status-cell";
import { TimestampCell } from "@/components/ui/timestamp-cell";
import { ActionCell } from "@/components/ui/action-cell";
import { Cell, CellContent } from "@/components/ui/cell";
import { Checkbox } from "@/components/ui/checkbox";
import { useDataTable } from "@/hooks/use-data-table";
import { Modals } from "@/lib/enums";
import { TableActionBar } from "@/components/table-action-bar";
import type { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type { DispatchType } from "@sizeupdashboard/convex/src/api/schema.js";
import type { ColumnDef } from "@tanstack/react-table";
import { usePreloadedQuery, type Preloaded } from "convex/react";
import { useMemo } from "react";

interface DispatchTypesTableProps {
  preloaded: Preloaded<typeof api.customization.paginatedDispatchTypes>;
}

export function DispatchTypesTable({ preloaded }: DispatchTypesTableProps) {
  const data = usePreloadedQuery(preloaded);
  
  const columns = useMemo<ColumnDef<DispatchType>[]>(
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
        accessorKey: "code",
        header: "Code",
        size: 120,
        enableResizing: true,
        cell: ({ row }) => {
          return <CopyCell value={row.original.code} />;
        },
        enableSorting: false,
      },
      {
        accessorKey: "group",
        header: "Group",
        size: 150,
        enableResizing: true,
        cell: ({ row }) => {
          return (
            <StatusCell 
              status={row.original.group} 
              variant="dispatch"
              statusType={row.original.group}
            />
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "name",
        header: "Name",
        minSize: 200,
        enableResizing: true,
        cell: ({ row }) => {
          const name = row.original.name;
          return (
            <Cell>
              <CellContent>{name || "No name"}</CellContent>
            </Cell>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "_creationTime",
        header: "Created At",
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
        meta: {
          variant: "number",
        },
      },
      {
        id: "actions",
        header: "",
        size: 50,
        enableResizing: true,
        cell: ({ row }) => {
          return (
            <ActionCell
              modalType={Modals.DISPATCH_TYPE}
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
      actionBar={<TableActionBar table={table} entityName="dispatch types" />}
    >
      <DataTableToolbar table={table}>
        <DataTableSortList table={table} />
      </DataTableToolbar>
    </DataTable>
  );
}