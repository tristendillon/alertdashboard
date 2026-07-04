"use client";

import { InfiniteDataTable } from "@/components/data-table/infinite-data-table";
import { CopyCell } from "@/components/ui/copy-cell";
import { StatusCell } from "@/components/ui/status-cell";
import { TimestampCell } from "@/components/ui/timestamp-cell";
import { ActionCell } from "@/components/ui/action-cell";
import { Cell, CellContent } from "@/components/ui/cell";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInfiniteTable } from "@/hooks/use-infinite-table";
import { useSearchList } from "@/hooks/use-search-list";
import { Modals } from "@/lib/enums";
import { TableActionBar } from "@/components/table-action-bar";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type {
  DispatchGroupEnum,
  DispatchType,
} from "@sizeupdashboard/convex/src/api/schema.js";
import type { ColumnDef } from "@tanstack/react-table";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useMemo } from "react";

// The convex package ships TypeScript sources, so its zod enum can only be
// imported as a type here; `satisfies` keeps this list in sync with it.
const DISPATCH_GROUPS = [
  "aircraft",
  "fire",
  "hazmat",
  "mva",
  "marine",
  "law",
  "rescue",
  "medical",
  "other",
] as const satisfies readonly DispatchGroupEnum[];

const ALL_GROUPS = "all";

export function DispatchTypesTable() {
  const [group, setGroup] = useQueryState(
    "group",
    parseAsStringEnum<DispatchGroupEnum>([...DISPATCH_GROUPS]),
  );
  const { results, status, loadMore, search, setSearch } = useSearchList(
    api.customization.listDispatchTypes,
    { group: group ?? undefined },
  );

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
        enableSorting: false,
        cell: ({ row }) => {
          return (
            <TimestampCell
              timestamp={row.original._creationTime}
              format="short-12h"
            />
          );
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

  const { table } = useInfiniteTable({
    data: results,
    columns,
    getRowId: (originalRow) => originalRow._id,
  });

  return (
    <InfiniteDataTable
      table={table}
      status={status}
      onLoadMore={loadMore}
      actionBar={<TableActionBar table={table} entityName="dispatch types" />}
    >
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search by code or name..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-sm"
        />
        <Select
          value={group ?? ALL_GROUPS}
          onValueChange={(value) =>
            setGroup(
              value === ALL_GROUPS ? null : (value as DispatchGroupEnum),
            )
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All groups" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_GROUPS}>All groups</SelectItem>
            {DISPATCH_GROUPS.map((option) => (
              <SelectItem key={option} value={option} className="capitalize">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </InfiniteDataTable>
  );
}
