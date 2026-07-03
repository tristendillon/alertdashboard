"use client";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { StatusCell } from "@/components/ui/status-cell";
import { JsonCell } from "@/components/ui/json-cell";
import { TimestampCell } from "@/components/ui/timestamp-cell";
import { ActionCell } from "@/components/ui/action-cell";
import { Cell, CellContent } from "@/components/ui/cell";
import { Checkbox } from "@/components/ui/checkbox";
import { useDataTable } from "@/hooks/use-data-table";
import { Modals } from "@/lib/enums";
import { TableActionBar } from "@/components/table-action-bar";
import type { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type { FieldTransformation } from "@sizeupdashboard/convex/src/api/schema.js";
import type { ColumnDef } from "@tanstack/react-table";
import { usePreloadedQuery, type Preloaded } from "convex/react";
import { useMemo } from "react";

interface FieldTransformationsTableProps {
  preloaded: Preloaded<typeof api.transformations.paginatedFieldTransformations>;
}

export function FieldTransformationsTable({ preloaded }: FieldTransformationsTableProps) {
  const data = usePreloadedQuery(preloaded);
  
  const columns = useMemo<ColumnDef<FieldTransformation>[]>(
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
        cell: ({ row }) => {
          return (
            <Cell>
              <CellContent className="font-medium">{row.original.name}</CellContent>
            </Cell>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "field",
        header: "Field",
        size: 180,
        enableResizing: true,
        cell: ({ row }) => {
          return (
            <Cell>
              <CellContent className="font-mono text-sm bg-muted/50 px-2 py-1 rounded">
                {row.original.field}
              </CellContent>
            </Cell>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "strategy",
        header: "Strategy",
        size: 140,
        enableResizing: true,
        cell: ({ row }) => {
          const strategyLabels = {
            static_value: "Static Value",
            random_offset: "Random Offset", 
            random_string: "Random String",
            merge_data: "Merge Data",
          };
          
          const strategy = row.original.strategy;
          const label = strategyLabels[strategy] || strategy;
          
          return <StatusCell status={label} variant="custom" />;
        },
        enableSorting: false,
      },
      {
        accessorKey: "params",
        header: "Parameters",
        minSize: 200,
        enableResizing: true,
        cell: ({ row }) => {
          return (
            <JsonCell 
              data={row.original.params}
              maxPreviewKeys={1}
            />
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
              modalType={Modals.FIELD_TRANSFORMATION}
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
      actionBar={<TableActionBar table={table} entityName="field transformations" />}
    >
      <DataTableToolbar table={table}>
        <DataTableSortList table={table} />
      </DataTableToolbar>
    </DataTable>
  );
}