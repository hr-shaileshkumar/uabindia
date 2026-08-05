"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/erp/status-badge";
import { Inbox, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { EntityAvatar } from "@/components/erp/crud-workspace";

type RowData = Record<string, string | number>;

function inferTone(value: string) {
  const normalized = value.toLowerCase();
  if (
    normalized.includes("approve") ||
    normalized.includes("active") ||
    normalized.includes("healthy") ||
    normalized.includes("present") ||
    normalized.includes("resolved") ||
    normalized.includes("completed")
  ) {
    return "positive" as const;
  }
  if (
    normalized.includes("pending") ||
    normalized.includes("late") ||
    normalized.includes("probation") ||
    normalized.includes("scheduled") ||
    normalized.includes("hold") ||
    normalized.includes("draft")
  ) {
    return "warning" as const;
  }
  if (
    normalized.includes("critical") ||
    normalized.includes("escalated") ||
    normalized.includes("notice") ||
    normalized.includes("low stock") ||
    normalized.includes("rejected")
  ) {
    return "critical" as const;
  }
  return "neutral" as const;
}

export function DataTable({
  title,
  description,
  rows,
  onRowClick,
  selectable = true,
  onSelectionChange,
  actions,
}: {
  title?: string;
  description?: string;
  rows: RowData[];
  onRowClick?: (row: RowData) => void;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: RowData[]) => void;
  actions?: React.ReactNode;
}) {
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  const columns = React.useMemo<ColumnDef<RowData>[]>(() => {
    const sample = rows[0] || {};
    const cols: ColumnDef<RowData>[] = [];

    // Selectable Checkbox Column
    if (selectable) {
      cols.push({
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            aria-label="Select all rows"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            aria-label="Select row"
          />
        ),
      });
    }

    Object.keys(sample).forEach((key) => {
      cols.push({
        accessorKey: key,
        header: key.replace(/([A-Z])/g, " $1").trim(),
        cell: ({ getValue, row }) => {
          const value = String(getValue() ?? "");
          const lowerKey = key.toLowerCase();

          if (lowerKey === "status" || lowerKey === "action" || lowerKey === "state") {
            return <StatusBadge tone={inferTone(value)}>{value}</StatusBadge>;
          }

          if (lowerKey === "name" || lowerKey === "employee" || lowerKey === "user") {
            const subtext = String(row.original.code || row.original.email || row.original.department || "");
            return <EntityAvatar name={value} subtext={subtext || undefined} />;
          }

          return <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{value}</span>;
        },
      });
    });

    return cols;
  }, [rows, selectable]);

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  React.useEffect(() => {
    if (onSelectionChange) {
      const selected = table.getSelectedRowModel().rows.map((r) => r.original);
      onSelectionChange(selected);
    }
  }, [rowSelection, onSelectionChange, table]);

  return (
    <div className="erp-table-wrap rounded-xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {(title || description || actions) && (
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between dark:border-slate-800 dark:bg-slate-900">
          <div>
            {title && (
              <h3 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10 dark:border-slate-800 dark:bg-slate-950">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 select-none"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-center" role="status">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800" aria-hidden="true">
                      <Inbox className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">No records found</p>
                    <p className="text-xs leading-5 text-slate-500">Apply a filter or add a new record to populate this data view.</p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={`transition-colors ${
                    onRowClick ? "cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40" : "hover:bg-slate-50/50"
                  } ${row.getIsSelected() ? "bg-blue-50/60 dark:bg-blue-950/30" : ""}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950">
          <span>
            Page <strong className="font-bold text-slate-900 dark:text-slate-100">{table.getState().pagination.pageIndex + 1}</strong> of{" "}
            <strong className="font-bold text-slate-900 dark:text-slate-100">{table.getPageCount()}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-7 w-7 p-0 rounded-md border-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-7 w-7 p-0 rounded-md border-slate-200"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
