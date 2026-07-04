"use client";

import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type TableOptions,
} from "@tanstack/react-table";
import * as React from "react";

interface UseInfiniteTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  getRowId: TableOptions<TData>["getRowId"];
}

/**
 * TanStack table for infinite-scroll lists: row selection only — ordering,
 * search, and pagination all live server-side (see useSearchList).
 */
export function useInfiniteTable<TData>({
  data,
  columns,
  getRowId,
}: UseInfiniteTableProps<TData>) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    {},
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    state: { rowSelection },
    getRowId,
  });

  return { table };
}
