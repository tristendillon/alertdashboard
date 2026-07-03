"use client";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { CopyCell } from "@/components/ui/copy-cell";
import { StatusCell } from "@/components/ui/status-cell";
import { NumberCell } from "@/components/ui/number-cell";
import { NarrativeCell } from "@/components/ui/narrative-cell";
import { TimestampCell } from "@/components/ui/timestamp-cell";
import { ActionCell } from "@/components/ui/action-cell";
import { Cell, CellContent } from "@/components/ui/cell";
import { Checkbox } from "@/components/ui/checkbox";
import { useDataTable } from "@/hooks/use-data-table";
import { Modals } from "@/lib/enums";
import { TableActionBar } from "@/components/table-action-bar";
import type { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type { ColumnDef } from "@tanstack/react-table";
import { usePreloadedQuery, type Preloaded } from "convex/react";
import { useMemo } from "react";
import type { Hydrant } from "@sizeupdashboard/convex/src/api/schema.js";

interface HydrantsTableProps {
  preloaded: Preloaded<typeof api.hydrants.paginatedHydrants>;
}

export function HydrantsTable({ preloaded }: HydrantsTableProps) {
  const data = usePreloadedQuery(preloaded);

  const columns = useMemo<ColumnDef<Hydrant>[]>(
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
        accessorKey: "hydrantId",
        header: "Hydrant ID",
        size: 100,
        enableResizing: true,
        cell: ({ row }) => {
          const hydrantId = row.original.hydrantId;
          if (!hydrantId)
            return (
              <Cell>
                <CellContent>—</CellContent>
              </Cell>
            );
          return <CopyCell value={hydrantId.toString()} />;
        },
        enableSorting: false,
      },
      {
        accessorKey: "address",
        header: "Address",
        minSize: 200,
        enableResizing: true,
        cell: ({ row }) => {
          const address = row.original.address;
          return (
            <Cell>
              <CellContent>{address || "No address"}</CellContent>
            </Cell>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "hydrantStatusCode",
        header: "Status",
        size: 120,
        enableResizing: true,
        cell: ({ row }) => {
          const status = row.original.hydrantStatusCode;
          if (!status)
            return (
              <Cell>
                <CellContent>—</CellContent>
              </Cell>
            );
          return <StatusCell status={status} variant="hydrant" />;
        },
        enableSorting: false,
      },
      {
        accessorKey: "numOutlet",
        header: "Outlets",
        size: 80,
        enableResizing: true,
        cell: ({ row }) => {
          return (
            <NumberCell
              value={row.original.numOutlet}
              decimals={0}
              emptyText="—"
            />
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "calculatedFlowRate",
        header: "Flow Rate",
        size: 110,
        enableResizing: true,
        cell: ({ row }) => {
          const flowRate = row.original.calculatedFlowRate;
          if (!flowRate) {
            return <NumberCell value={null} emptyText="—" />;
          }

          // Try to parse as number if it's a numeric string
          const numericValue = parseFloat(flowRate);
          if (!isNaN(numericValue)) {
            return <NumberCell value={numericValue} unit="GPM" decimals={1} />;
          }

          // Otherwise display as text
          return (
            <Cell>
              <CellContent className="font-mono">{flowRate}</CellContent>
            </Cell>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "notes",
        header: "Notes",
        minSize: 150,
        enableResizing: true,
        cell: ({ row }) => {
          return <NarrativeCell text={row.original.notes} maxLength={80} />;
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
              modalType={Modals.HYDRANT}
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
      actionBar={<TableActionBar table={table} entityName="hydrants" />}
    >
      <DataTableToolbar table={table}>
        <DataTableSortList table={table} />
      </DataTableToolbar>
    </DataTable>
  );
}
