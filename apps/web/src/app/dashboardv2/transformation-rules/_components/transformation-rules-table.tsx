"use client";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { RegexCell } from "@/components/ui/regex-cell";
import { ArrayCell } from "@/components/ui/array-cell";
import { TimestampCell } from "@/components/ui/timestamp-cell";
import { NumberCell } from "@/components/ui/number-cell";
import { ActionCell } from "@/components/ui/action-cell";
import { Cell, CellContent } from "@/components/ui/cell";
import { Checkbox } from "@/components/ui/checkbox";
import { useDataTable } from "@/hooks/use-data-table";
import { Modals } from "@/lib/enums";
import { TableActionBar } from "@/components/table-action-bar";
import type { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type { TransformationRule } from "@sizeupdashboard/convex/src/api/schema.js";
import type { ColumnDef } from "@tanstack/react-table";
import { usePreloadedQuery, type Preloaded } from "convex/react";
import { useMemo } from "react";

interface TransformationRulesTableProps {
  preloaded: Preloaded<typeof api.transformations.paginatedTransformationRules>;
}

export function TransformationRulesTable({ preloaded }: TransformationRulesTableProps) {
  const data = usePreloadedQuery(preloaded);
  
  const columns = useMemo<ColumnDef<TransformationRule>[]>(
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
        accessorKey: "dispatchTypeRegex",
        header: "Dispatch Regex",
        minSize: 200,
        enableResizing: true,
        cell: ({ row }) => {
          return (
            <RegexCell 
              pattern={row.original.dispatchTypeRegex}
              showValidation={true}
            />
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "keywords",
        header: "Keywords",
        size: 180,
        enableResizing: true,
        cell: ({ row }) => {
          return (
            <ArrayCell 
              items={row.original.keywords}
              maxVisible={2}
              badgeVariant="outline"
            />
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "dispatchTypes",
        header: "Dispatch Types",
        size: 120,
        enableResizing: true,
        cell: ({ row }) => {
          const count = row.original.dispatchTypes.length;
          return (
            <NumberCell 
              value={count}
              suffix={count === 1 ? " type" : " types"}
              decimals={0}
            />
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "transformations",
        header: "Transformations",
        size: 140,
        enableResizing: true,
        cell: ({ row }) => {
          const count = row.original.transformations.length;
          return (
            <NumberCell 
              value={count}
              suffix={count === 1 ? " transform" : " transforms"}
              decimals={0}
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
              modalType={Modals.TRANSFORMATION_RULE}
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
      actionBar={<TableActionBar table={table} entityName="transformation rules" />}
    >
      <DataTableToolbar table={table}>
        <DataTableSortList table={table} />
      </DataTableToolbar>
    </DataTable>
  );
}