"use client";

import { InfiniteDataTable } from "@/components/data-table/infinite-data-table";
import { RegexCell } from "@/components/ui/regex-cell";
import { ArrayCell } from "@/components/ui/array-cell";
import { TimestampCell } from "@/components/ui/timestamp-cell";
import { NumberCell } from "@/components/ui/number-cell";
import { ActionCell } from "@/components/ui/action-cell";
import { Cell, CellContent } from "@/components/ui/cell";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { useInfiniteTable } from "@/hooks/use-infinite-table";
import { useSearchList } from "@/hooks/use-search-list";
import { useDrawerState } from "@/hooks/nuqs/use-drawer-state";
import { DrawerEntity, DrawerMode } from "@/lib/enums";
import { TableActionBar } from "@/components/table-action-bar";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import type { Id } from "@sizeupdashboard/convex/src/api/_generated/dataModel.js";
import type { TransformationRule } from "@sizeupdashboard/convex/src/api/schema.js";
import type { ColumnDef } from "@tanstack/react-table";
import { useMutation } from "convex/react";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

export function TransformationRulesTable() {
  const { open } = useDrawerState();
  const { results, status, loadMore, search, setSearch } = useSearchList(
    api.transformations.listTransformationRules,
  );
  const setEnabled = useMutation(api.transformations.setTransformationRuleEnabled);

  const toggleEnabled = useCallback(
    async (id: Id<"transformationRules">, enabled: boolean) => {
      try {
        await setEnabled({ id, enabled });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update rule",
        );
      }
    },
    [setEnabled],
  );

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
              <CellContent className="font-medium">
                {row.original.name}
              </CellContent>
            </Cell>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "enabled",
        header: "Status",
        size: 130,
        enableResizing: true,
        cell: ({ row }) => {
          const enabled = row.original.enabled !== false;
          return (
            <Cell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={enabled}
                  onCheckedChange={(next) =>
                    void toggleEnabled(row.original._id, next)
                  }
                  aria-label={enabled ? "Disable rule" : "Enable rule"}
                />
                <span className="text-muted-foreground text-xs">
                  {enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
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
              entity={DrawerEntity.TRANSFORMATION_RULE}
              itemId={row.original._id}
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [toggleEnabled],
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
      rowClassName={(rule) => (rule.enabled === false ? "opacity-55" : undefined)}
      actionBar={
        <TableActionBar table={table} entityName="transformation rules" />
      }
    >
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-sm"
        />
        <Button
          size="sm"
          onClick={() => open(DrawerEntity.TRANSFORMATION_RULE, DrawerMode.CREATE)}
        >
          <Plus className="mr-1 size-4" />
          New rule
        </Button>
      </div>
    </InfiniteDataTable>
  );
}
