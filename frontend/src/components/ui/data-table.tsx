import * as React from "react";
import { cn } from "@/lib/utils";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Inbox, ChevronDown, ChevronUp, Filter, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type RowData = Record<string, string | number>;

function inferTone(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("approve") || normalized.includes("active") || normalized.includes("healthy") || normalized.includes("present") || normalized.includes("resolved")) {
    return "positive" as const;
  }
  if (normalized.includes("pending") || normalized.includes("late") || normalized.includes("probation") || normalized.includes("scheduled") || normalized.includes("hold")) {
    return "warning" as const;
  }
  if (normalized.includes("critical") || normalized.includes("escalated") || normalized.includes("notice") || normalized.includes("low stock")) {
    return "danger" as const;
  }
  return "neutral" as const;
}

export function DataTable({
  title,
  description,
  columns,
  data,
  enableSorting = true,
  enableFiltering = false,
}: {
  title: string;
  description: string;
  columns: ColumnDef<RowData>[];
  data: RowData[];
  enableSorting?: boolean;
  enableFiltering?: boolean;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [filterValue, setFilterValue] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
      globalFilter: filterValue,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {enableFiltering && (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Filter..."
                  value={filterValue}
                  onChange={(event) => setFilterValue(event.target.value)}
                  className="pl-9 w-48"
                />
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table.getAllColumns().filter((column) => column.getCanHide()).map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-slate-200 transition-colors hover:bg-slate-50/50">
                    {headerGroup.headers.map((header) => {
                      return (
                        <th key={header.id} className="h-12 px-4 text-left align-middle font-medium text-slate-500 [&:has([role=checkbox])]:pr-0">
                          {header.isPlaceholder ? null : (
                            <div
                              className={cn(
                                "flex items-center",
                                enableSorting && header.column.getCanSort() ? "cursor-pointer select-none" : ""
                              )}
                              onClick={() => header.column.toggleSorting()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {enableSorting && header.column.getCanSort() && (
                                <span className="ml-2">
                                  {header.column.getIsSorted() === "asc" ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : header.column.getIsSorted() === "desc" ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 opacity-30" />
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
              <tbody className="[&_tr:last-child]:border-0">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 py-12">
                        <Inbox className="h-8 w-8 text-slate-400" />
                        <p className="text-sm font-medium text-slate-900">No results found</p>
                        <p className="text-sm text-slate-500">Try adjusting your filters or check back later.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-200 transition-colors hover:bg-slate-50/50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-4 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex items-center justify-between py-4">
          <div className="flex-1 text-sm text-slate-500">
            {table.getFilteredRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) displayed
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
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
