"use client";

import React, { useMemo } from "react";
import { Download, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErpReportViewProps {
  rows: any[];
  columns: Array<{ key: string; label: string; dataType?: string }>;
  onExportCsv?: () => void;
  title?: string;
}

export function ErpReportView({
  rows,
  columns,
  onExportCsv,
  title = "Report",
}: ErpReportViewProps) {
  // Compute basic statistical aggregates
  const totalCount = rows.length;
  const activeCount = rows.filter(
    (r) => String(r.status ?? r.isActive).toLowerCase() === "active" || r.isActive === true
  ).length;

  const displayCols = useMemo(
    () => columns.filter((c) => c.key !== "actions" && c.key !== "_"),
    [columns]
  );

  return (
    <div className="space-y-4 w-full">
      {/* KPI Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Entries</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{totalCount.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3.5 shadow-2xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Active Records</p>
          <p className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">{activeCount.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Attributes Tracked</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{displayCols.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Export Report</p>
            <p className="text-xs text-slate-500 mt-0.5">CSV / Excel export</p>
          </div>
          {onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-3 text-xs font-semibold text-white shadow-2xs transition-colors dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>

      {/* Aggregate Report Table */}
      <div className="rounded-xl border border-slate-200/90 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">{title} Summary Matrix</h3>
          </div>
          <span className="text-[11px] text-slate-400">Aggregated from {totalCount} records</span>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/50">
                <th className="px-4 py-2.5 font-bold text-slate-600 dark:text-slate-300">#</th>
                {displayCols.map((col) => (
                  <th key={col.key} className="px-4 py-2.5 font-bold text-slate-600 dark:text-slate-300">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.slice(0, 100).map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-2 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                  {displayCols.map((col) => (
                    <td key={col.key} className="px-4 py-2 text-slate-700 dark:text-slate-200 truncate max-w-[200px]">
                      {String(row[col.key] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
