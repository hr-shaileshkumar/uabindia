"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { Inbox, ChevronDown, ChevronUp, Filter, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface DataTableProps<TData> {
  title?: string;
  description?: string;
  columns: ColumnDef<TData, any>[];
  data: TData[];
  enableSorting?: boolean;
  enableFiltering?: boolean;
  striped?: boolean;
  isLoading?: boolean;
  skeletonRows?: number;
  className?: string;
  actions?: React.ReactNode;
}

export function DataTable<TData>({
  title,
  description,
  columns,
  data,
  enableSorting = true,
  enableFiltering = true,
  striped = false,
  isLoading = false,
  skeletonRows = 5,
  className = "",
  actions,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const rows = table.getRowModel().rows;
  const rowVirtualizer = useVirtualizer({
    count: isLoading ? 0 : rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 44,
    overscan: 12,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]!.start : 0;
  const paddingBottom =
    virtualRows.length > 0 ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1]!.end : 0;

  return (
    <Card className={cn("border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm", className)}>
      {(title || description || actions || enableFiltering) && (
        <CardHeader className="border-b border-[var(--border-subtle)] pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {title && <CardTitle className="text-base font-semibold text-[var(--text-main)]">{title}</CardTitle>}
              {description && <CardDescription className="text-xs text-[var(--text-muted)] mt-1">{description}</CardDescription>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {enableFiltering && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
                  <Input
                    placeholder="Search all records..."
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="pl-9 h-9 w-48 sm:w-64 text-xs bg-[var(--bg-app)] border-[var(--border-subtle)] text-[var(--text-main)] focus-visible:ring-[var(--primary)]"
                  />
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]">
                    <Filter className="mr-1.5 h-3.5 w-3.5" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-main)]">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize text-xs"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
              {actions}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div ref={scrollRef} className="relative overflow-auto max-h-[600px] border-b border-[var(--border-subtle)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] shadow-xs">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <th
                        key={header.id}
                        className="px-4 py-3 font-semibold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-muted)]/50 select-none whitespace-nowrap"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              "flex items-center gap-1.5",
                              enableSorting && header.column.getCanSort() ? "cursor-pointer hover:text-[var(--text-main)] transition-colors" : ""
                            )}
                            onClick={() => enableSorting && header.column.getCanSort() && header.column.toggleSorting()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {enableSorting && header.column.getCanSort() && (
                              <span>
                                {header.column.getIsSorted() === "asc" ? (
                                  <ChevronUp className="h-3.5 w-3.5 text-[var(--primary)]" />
                                ) : header.column.getIsSorted() === "desc" ? (
                                  <ChevronDown className="h-3.5 w-3.5 text-[var(--primary)]" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)] opacity-30" />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-surface)]">
              {isLoading ? (
                Array.from({ length: skeletonRows }).map((_, idx) => (
                  <tr key={`skeleton-row-${idx}`}>
                    {columns.map((_, colIdx) => (
                      <td key={`skeleton-col-${colIdx}`} className="px-4 py-3">
                        <Skeleton className="h-4 w-full bg-[var(--border-subtle)]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox className="h-8 w-8 text-[var(--text-muted)] opacity-60" />
                      <p className="text-sm font-medium text-[var(--text-main)]">No records found</p>
                      <p className="text-xs text-[var(--text-muted)]">Try adjusting your filters or search terms.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {paddingTop > 0 ? (
                    <tr aria-hidden="true">
                      <td colSpan={columns.length} style={{ height: paddingTop }} className="p-0" />
                    </tr>
                  ) : null}
                  {virtualRows.map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    if (!row) return null;
                    return (
                      <tr
                        key={row.id}
                        data-index={virtualRow.index}
                        className={cn(
                          "transition-colors hover:bg-[var(--bg-surface-hover)]",
                          striped && virtualRow.index % 2 === 1 ? "bg-[var(--bg-app)]/50" : ""
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3 align-middle text-[var(--text-main)] whitespace-nowrap">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {paddingBottom > 0 ? (
                    <tr aria-hidden="true">
                      <td colSpan={columns.length} style={{ height: paddingBottom }} className="p-0" />
                    </tr>
                  ) : null}
                </>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 gap-3 text-xs text-[var(--text-muted)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2">
            <span>
              Showing Page <strong className="text-[var(--text-main)]">{table.getState().pagination.pageIndex + 1}</strong> of{" "}
              <strong className="text-[var(--text-main)]">{table.getPageCount() || 1}</strong> ({table.getFilteredRowModel().rows.length} total items)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="h-8 px-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-main)] text-xs focus:ring-[var(--primary)]"
            >
              {[10, 20, 30, 50, 100].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-[var(--border-subtle)] text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] disabled:opacity-40"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-[var(--border-subtle)] text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] disabled:opacity-40"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
