"use client";

import React, { useState, useMemo } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Code2,
  Check,
  CheckSquare,
  Square,
  X,
  Layers,
  Filter,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { getRowFieldValue } from "@/lib/workspace/list-view";
import type { DynamicColumn } from "@/lib/dynamic-schema/types";

export type ExportFormat = "csv" | "excel" | "json";
export type ExportDataScope = "filtered" | "overall" | "selected";

export interface UniversalExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string;
  pageKey?: string;
  columns: DynamicColumn[];
  filteredRecords: any[];
  allRecords?: any[];
  selectedIds?: string[];
  idField?: string;
  onServerExport?: (options: {
    format: ExportFormat;
    scope: ExportDataScope;
    columns: string[];
  }) => Promise<boolean>;
}

export function UniversalExportModal({
  open,
  onOpenChange,
  entityName,
  pageKey,
  columns,
  filteredRecords,
  allRecords = [],
  selectedIds = [],
  idField = "id",
  onServerExport,
}: UniversalExportModalProps) {
  // Filter out pure action or system columns
  const exportableColumns = useMemo(() => {
    return columns.filter(
      (c) =>
        c.key !== "actions" &&
        c.key !== "_" &&
        c.key !== "select" &&
        !c.hidden
    );
  }, [columns]);

  // Format selection: CSV (default), Excel, JSON
  const [format, setFormat] = useState<ExportFormat>("csv");

  // Scope selection: Filtered (default), Overall, Selected
  const [scope, setScope] = useState<ExportDataScope>(
    selectedIds.length > 0 ? "selected" : "filtered"
  );

  // Selected column keys state - default to all exportable columns
  const [selectedColKeys, setSelectedColKeys] = useState<string[]>(() =>
    exportableColumns.map((c) => c.key)
  );

  // Column search filter in modal
  const [colSearch, setColSearch] = useState("");

  const [isExporting, setIsExporting] = useState(false);

  // Synchronize columns when exportableColumns changes
  React.useEffect(() => {
    if (exportableColumns.length > 0 && selectedColKeys.length === 0) {
      setSelectedColKeys(exportableColumns.map((c) => c.key));
    }
  }, [exportableColumns]);

  // Selected rows according to chosen scope
  const targetRecords = useMemo(() => {
    if (scope === "selected") {
      return (filteredRecords.length > 0 ? filteredRecords : allRecords).filter(
        (r) => selectedIds.includes(String(r[idField] || r.id))
      );
    }
    if (scope === "overall" && allRecords.length > 0) {
      return allRecords;
    }
    return filteredRecords;
  }, [scope, filteredRecords, allRecords, selectedIds, idField]);

  // Filtered columns based on search
  const visibleColList = useMemo(() => {
    if (!colSearch.trim()) return exportableColumns;
    const q = colSearch.toLowerCase().trim();
    return exportableColumns.filter(
      (c) =>
        c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q)
    );
  }, [exportableColumns, colSearch]);

  const handleToggleCol = (key: string) => {
    setSelectedColKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAllCols = () => {
    setSelectedColKeys(exportableColumns.map((c) => c.key));
  };

  const handleDeselectAllCols = () => {
    setSelectedColKeys([]);
  };

  const handleSelectMandatoryOnly = () => {
    const mandatoryKeys = exportableColumns
      .filter((c) => (c as any).required === true || ["name", "code", "title", "employeeCode", "companyName", "itemCode"].includes(c.key) || c.key.toLowerCase().includes("name") || c.key.toLowerCase().includes("code") || c.key.toLowerCase().includes("id"))
      .map((c) => c.key);
    setSelectedColKeys(mandatoryKeys.length > 0 ? mandatoryKeys : exportableColumns.slice(0, 3).map((c) => c.key));
  };

  const handleExecuteExport = async () => {
    if (selectedColKeys.length === 0) {
      notifyError("Please select at least one column to export.");
      return;
    }

    if (targetRecords.length === 0) {
      notifyError("No records found to export under the selected scope.");
      return;
    }

    try {
      setIsExporting(true);

      // Attempt server export hook if provided
      if (onServerExport) {
        const handled = await onServerExport({
          format,
          scope,
          columns: selectedColKeys,
        });
        if (handled) {
          notifySuccess(`Exported ${targetRecords.length} records successfully.`);
          onOpenChange(false);
          return;
        }
      }

      const activeCols = exportableColumns.filter((c) =>
        selectedColKeys.includes(c.key)
      );

      const timestamp = new Date().toISOString().slice(0, 10);
      const safeEntity = (entityName || "records").toLowerCase().replace(/\s+/g, "_");
      const filename = `${pageKey || safeEntity}_export_${timestamp}`;

      if (format === "json") {
        const jsonPayload = targetRecords.map((row) => {
          const item: Record<string, any> = {};
          activeCols.forEach((c) => {
            item[c.key] = getRowFieldValue(row, c.key) ?? null;
          });
          return item;
        });

        const blob = new Blob([JSON.stringify(jsonPayload, null, 2)], {
          type: "application/json;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // CSV & Excel (CSV with UTF-8 BOM opens natively in Excel)
        const headers = activeCols.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(",");
        const rows = targetRecords.map((row) =>
          activeCols
            .map((c) => `"${String(getRowFieldValue(row, c.key) ?? "").replace(/"/g, '""')}"`)
            .join(",")
        );

        const csvContent = "\uFEFF" + [headers, ...rows].join("\r\n");
        const mimeType =
          format === "excel"
            ? "application/vnd.ms-excel;charset=utf-8;"
            : "text/csv;charset=utf-8;";

        const ext = format === "excel" ? "csv" : "csv"; // CSV format with UTF-8 BOM natively opens in Microsoft Excel
        const blob = new Blob([csvContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      notifySuccess(
        "Export Complete",
        `Exported ${targetRecords.length} records with ${activeCols.length} columns.`
      );
      onOpenChange(false);
    } catch (err: any) {
      notifyError(err?.message || "Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-3.5 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 shrink-0">
              <Download className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Export {entityName || "Records"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Configure export format, record scope, and select columns to download.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[72vh] overflow-y-auto scrollbar-thin">
          {/* 1. Format Choice */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Choose Export Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormat("csv")}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer",
                  format === "csv"
                    ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/20"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-800"
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 shrink-0">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">CSV (.csv)</div>
                  <div className="text-[10px] text-slate-500">Universal standard</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat("excel")}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer",
                  format === "excel"
                    ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/20"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-800"
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 shrink-0">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Excel (Spreadsheet)</div>
                  <div className="text-[10px] text-slate-500">MS Excel format</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat("json")}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer",
                  format === "json"
                    ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/20"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-800"
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 shrink-0">
                  <Code2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">JSON (.json)</div>
                  <div className="text-[10px] text-slate-500">Raw enterprise data</div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Scope Choice */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2. Choose Data Scope
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setScope("filtered")}
                className={cn(
                  "flex flex-col justify-between rounded-xl border p-3 text-left transition-all cursor-pointer",
                  scope === "filtered"
                    ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/20"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-800"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Filtered Records</span>
                  <Filter className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                  {filteredRecords.length} record(s)
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Matching current view</div>
              </button>

              <button
                type="button"
                onClick={() => setScope("overall")}
                className={cn(
                  "flex flex-col justify-between rounded-xl border p-3 text-left transition-all cursor-pointer",
                  scope === "overall"
                    ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/20"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-800"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">All Records (Overall)</span>
                  <Layers className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                  {allRecords.length > 0 ? allRecords.length : filteredRecords.length} record(s)
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Complete database set</div>
              </button>

              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={() => setScope("selected")}
                className={cn(
                  "flex flex-col justify-between rounded-xl border p-3 text-left transition-all",
                  selectedIds.length === 0
                    ? "opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40"
                    : scope === "selected"
                    ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/20 dark:border-indigo-500 dark:bg-indigo-950/20 cursor-pointer"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Selected Records</span>
                  <CheckSquare className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                  {selectedIds.length} record(s)
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Checked in table</div>
              </button>
            </div>
          </div>

          {/* 3. Column Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                3. Choose Columns ({selectedColKeys.length} of {exportableColumns.length} selected)
              </label>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAllCols}
                  className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-semibold px-1.5 py-0.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                >
                  All
                </button>
                <span className="text-slate-300 dark:text-slate-700">&middot;</span>
                <button
                  type="button"
                  onClick={handleSelectMandatoryOnly}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 font-semibold px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Mandatory Only
                </button>
                <span className="text-slate-300 dark:text-slate-700">&middot;</span>
                <button
                  type="button"
                  onClick={handleDeselectAllCols}
                  className="text-slate-500 hover:text-rose-600 font-semibold px-1.5 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Column Checkboxes Grid */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {visibleColList.map((col) => {
                  const isChecked = selectedColKeys.includes(col.key);
                  return (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => handleToggleCol(col.key)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all border select-none cursor-pointer",
                        isChecked
                          ? "bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-white shadow-2xs font-semibold"
                          : "bg-transparent border-transparent text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <div
                        className={cn(
                          "h-4 w-4 rounded flex items-center justify-center border transition-colors shrink-0",
                          isChecked
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                        )}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{col.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-5 py-3 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="text-xs text-slate-500">
            Ready to export: <strong className="text-slate-800 dark:text-slate-200">{targetRecords.length} records</strong>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors shadow-2xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteExport}
              disabled={isExporting || selectedColKeys.length === 0 || targetRecords.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? "Exporting…" : `Export ${targetRecords.length} Record(s)`}</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default UniversalExportModal;
