"use client";

import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import type { PaginationStatus } from "convex/react";
import * as React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { getCommonPinningStyles } from "@/lib/data-table";
import { cn } from "@/utils/ui";

const LOAD_MORE_NUM_ITEMS = 50;

interface InfiniteDataTableProps<TData> extends React.ComponentProps<"div"> {
  table: TanstackTable<TData>;
  status: PaginationStatus;
  onLoadMore: (numItems: number) => void;
  actionBar?: React.ReactNode;
}

/**
 * DataTable variant for cursor pagination: instead of page controls, a
 * sentinel below the table loads the next batch when scrolled into view.
 */
export function InfiniteDataTable<TData>({
  table,
  status,
  onLoadMore,
  actionBar,
  children,
  className,
  ...props
}: InfiniteDataTableProps<TData>) {
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (status !== "CanLoadMore") return;
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore(LOAD_MORE_NUM_ITEMS);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => {
      observer.unobserve(sentinel);
    };
  }, [status, onLoadMore]);

  const isLoading = status === "LoadingFirstPage" || status === "LoadingMore";
  const columnCount = table.getAllColumns().length;

  return (
    <div
      className={cn("flex w-full flex-col gap-2.5 overflow-auto", className)}
      {...props}
    >
      {children}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{
                      ...getCommonPinningStyles({ column: header.column }),
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        ...getCommonPinningStyles({ column: cell.column }),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isLoading ? null : (
              <TableRow>
                <TableCell colSpan={columnCount} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
            {isLoading && (
              <TableRow>
                <TableCell colSpan={columnCount}>
                  <div className="flex flex-col gap-2 py-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div ref={loadMoreRef} aria-hidden className="h-px" />
      {actionBar &&
        table.getFilteredSelectedRowModel().rows.length > 0 &&
        actionBar}
    </div>
  );
}
