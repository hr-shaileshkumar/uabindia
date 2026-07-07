"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/erp/status-badge";

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
    return "critical" as const;
  }
  return "neutral" as const;
}

export function DataTable({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: RowData[];
}) {
  const columns = React.useMemo<ColumnDef<RowData>[]>(() => {
    const sample = rows[0] || {};

    return Object.keys(sample).map((key) => ({
      accessorKey: key,
      header: key,
      cell: ({ getValue }) => {
        const value = String(getValue() ?? "");
        if (key.toLowerCase() === "status" || key.toLowerCase() === "action") {
          return <StatusBadge tone={inferTone(value)}>{value}</StatusBadge>;
        }
        return <span className="text-sm text-slate-700">{value}</span>;
      },
    }));
  }, [rows]);

  // TanStack Table manages imperative internals that the React Compiler flags.
  // This wrapper is intentionally left un-memoized.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/85 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 border-b border-slate-200/85 bg-white/85 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">Export</Button>
          <Button variant="secondary" size="sm">View details</Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50/90">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100/90 transition hover:bg-[linear-gradient(90deg,rgba(248,250,252,0.95),rgba(255,255,255,0.95))]">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-5 py-4 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
