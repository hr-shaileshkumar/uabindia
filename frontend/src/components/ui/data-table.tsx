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
import { Inbox, ChevronDown, ChevronUp, Filter, Search, Rows3, Download, FileText, FileSpreadsheet, Printer } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
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
  enableExport?: boolean;
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
  enableExport = true,
  striped = false,
  isLoading = false,
  skeletonRows = 5,
  className = "",
  actions,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [density, setDensity] = React.useState<"compact" | "normal">("normal");
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
    estimateSize: () => (density === "compact" ? 36 : 46),
    overscan: 12,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]!.start : 0;
  const paddingBottom =
    virtualRows.length > 0 ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1]!.end : 0;

  const handleExportCsv = () => {
    if (!data.length) return;
    const visibleCols = table.getVisibleFlatColumns().filter((col) => col.id !== "actions" && col.id !== "select");
    const headers = visibleCols.map((c) => (typeof c.columnDef.header === "string" ? c.columnDef.header : c.id));
    const rowsCsv = table.getFilteredRowModel().rows.map((row) =>
      visibleCols.map((c) => {
        const val = row.getValue(c.id);
        return `"${String(val ?? "").replace(/"/g, '""')}"`;
      }).join(","),
    );
    const csvContent = [headers.join(","), ...rowsCsv].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${title ? title.toLowerCase().replace(/\s+/g, "_") : "export"}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className={cn("border border-slate-200/90 bg-white shadow-xs rounded-2xl overflow-hidden dark:border-slate-800 dark:bg-slate-900", className)}>
      {(title || description || actions || enableFiltering) && (
        <CardHeader className="border-b border-slate-100 p-4 dark:border-slate-800 dark:bg-slate-950/30">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {title && <CardTitle className="text-base font-bold text-slate-900 dark:text-white">{title}</CardTitle>}
              {description && <CardDescription className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{description}</CardDescription>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {enableFiltering && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search records…"
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="pl-8.5 h-8 w-44 sm:w-60 text-xs bg-slate-50/70 border-slate-200 text-slate-900 rounded-lg focus-visible:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              )}

              {/* Density Toggle */}
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-xs gap-1.5 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={() => setDensity((d) => (d === "compact" ? "normal" : "compact"))}
                title={density === "compact" ? "Switch to comfortable view" : "Switch to compact view"}
              >
                <Rows3 className="h-3.5 w-3.5 text-slate-400" />
                <span className="hidden sm:inline">{density === "compact" ? "Compact" : "Comfortable"}</span>
              </Button>

              {/* Columns Customizer */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-xs gap-1.5 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border-slate-200 shadow-xl rounded-xl p-1 w-48 dark:bg-slate-900 dark:border-slate-800">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize text-xs rounded-lg"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Export Dropdown */}
              {enableExport && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg text-xs gap-1.5 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">
                      <Download className="h-3.5 w-3.5 text-slate-400" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border-slate-200 shadow-xl rounded-xl p-1 w-44 dark:bg-slate-900 dark:border-slate-800">
                    <DropdownMenuItem onClick={handleExportCsv} className="text-xs gap-2 rounded-lg cursor-pointer">
                      <FileText className="h-3.5 w-3.5 text-emerald-600" />
                      Export CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.print()} className="text-xs gap-2 rounded-lg cursor-pointer">
                      <Printer className="h-3.5 w-3.5 text-blue-600" />
                      Print View
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {actions}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div ref={scrollRef} className="relative overflow-auto max-h-[600px] scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-xs border-b border-slate-200 shadow-2xs dark:bg-slate-950/90 dark:border-slate-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          "px-4 font-bold text-slate-500 uppercase tracking-wider select-none whitespace-nowrap dark:text-slate-400",
                          density === "compact" ? "py-2 text-[11px]" : "py-3 text-[11px]",
                        )}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              "flex items-center gap-1.5",
                              enableSorting && header.column.getCanSort() ? "cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors" : "",
                            )}
                            onClick={() => enableSorting && header.column.getCanSort() && header.column.toggleSorting()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {enableSorting && header.column.getCanSort() && (
                              <span>
                                {header.column.getIsSorted() === "asc" ? (
                                  <ChevronUp className="h-3.5 w-3.5 text-blue-600" />
                                ) : header.column.getIsSorted() === "desc" ? (
                                  <ChevronDown className="h-3.5 w-3.5 text-blue-600" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5 text-slate-300 opacity-40 dark:text-slate-600" />
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: skeletonRows }).map((_, index) => (
                  <tr key={index} className="h-10">
                    <td colSpan={columns.length} className="px-4 py-2">
                      <Skeleton className="h-5 w-full rounded bg-slate-100 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                        <Inbox className="h-4.5 w-4.5" />
                      </span>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No records found</p>
                      <p className="text-xs text-slate-500">Try adjusting your filters or search query.</p>
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
                          "transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40",
                          striped && virtualRow.index % 2 === 1 ? "bg-slate-50/40 dark:bg-slate-900/40" : "",
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className={cn(
                              "px-4 align-middle text-slate-700 whitespace-nowrap dark:text-slate-300 tabular-nums",
                              density === "compact" ? "py-1.5 text-xs" : "py-3 text-xs",
                            )}
                          >
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
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 gap-3 text-xs text-slate-500 border-t border-slate-100 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-950/20">
          <div className="flex items-center gap-2">
            <span>
              Page <strong className="text-slate-900 dark:text-white">{table.getState().pagination.pageIndex + 1}</strong> of{" "}
              <strong className="text-slate-900 dark:text-white">{table.getPageCount() || 1}</strong> ({table.getFilteredRowModel().rows.length} total items)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              aria-label="Rows per page"
              className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
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
              className="h-8 px-3 text-xs border-slate-200 text-slate-700 hover:bg-white rounded-lg disabled:opacity-40 dark:border-slate-800 dark:text-slate-300"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-slate-200 text-slate-700 hover:bg-white rounded-lg disabled:opacity-40 dark:border-slate-800 dark:text-slate-300"
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
