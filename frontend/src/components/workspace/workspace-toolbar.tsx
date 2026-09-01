"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import {
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Rows3,
  LayoutGrid,
  List,
  RefreshCw,
  X,
} from "lucide-react";
import { ColumnCustomizer, type ColumnItem } from "./column-customizer";
import { cn } from "@/lib/utils";

export interface StatusFilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface WorkspaceToolbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;

  statusOptions?: StatusFilterOption[];
  activeStatus?: string;
  onStatusChange?: (status: string) => void;

  onOpenAdvancedFilter?: () => void;
  activeFilterCount?: number;

  columns?: ColumnItem[];
  visibleColumnKeys?: string[];
  onToggleColumn?: (key: string) => void;
  onShowAllColumns?: () => void;
  onResetColumns?: () => void;

  density?: "compact" | "normal";
  onToggleDensity?: () => void;

  viewMode?: "table" | "grid";
  onViewModeChange?: (mode: "table" | "grid") => void;

  onExportCsv?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;

  onRefresh?: () => void;
  isRefreshing?: boolean;

  totalCount?: number;
  filteredCount?: number;

  actions?: ReactNode;
}

export function WorkspaceToolbar({
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Search records…",
  statusOptions,
  activeStatus,
  onStatusChange,
  onOpenAdvancedFilter,
  activeFilterCount = 0,
  columns,
  visibleColumnKeys,
  onToggleColumn,
  onShowAllColumns,
  onResetColumns,
  density = "normal",
  onToggleDensity,
  viewMode = "table",
  onViewModeChange,
  onExportCsv,
  onExportExcel,
  onPrint,
  onRefresh,
  isRefreshing,
  totalCount,
  filteredCount,
  actions,
}: WorkspaceToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setExportOpen(false);
      }
    }
    if (exportOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [exportOpen]);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Top Bar: Search, Status Tabs, Record Count, and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Search Input & Status Pills */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {onSearchChange && (
            <div className="relative min-w-48 sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-8.5 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-7 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </div>
          )}

          {/* Quick Status Tabs */}
          {statusOptions && statusOptions.length > 0 && onStatusChange && (
            <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50/70 p-0.5 dark:border-slate-800 dark:bg-slate-900">
              {statusOptions.map((opt) => {
                const isActive = activeStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onStatusChange(opt.value)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all whitespace-nowrap",
                      isActive
                        ? "bg-white text-blue-700 shadow-2xs font-bold dark:bg-slate-800 dark:text-blue-400"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
                    )}
                  >
                    <span>{opt.label}</span>
                    {typeof opt.count === "number" && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.2 text-[9px] font-bold",
                          isActive
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                            : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                        )}
                      >
                        {opt.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Tools Cluster */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Advanced Filter Trigger */}
          {onOpenAdvancedFilter && (
            <button
              type="button"
              onClick={onOpenAdvancedFilter}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium transition-colors shadow-2xs",
                activeFilterCount > 0
                  ? "border-blue-300 bg-blue-50/70 text-blue-700 font-semibold dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400"
                  : "text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          {/* Column Customizer */}
          {columns && visibleColumnKeys && onToggleColumn && onShowAllColumns && onResetColumns && (
            <ColumnCustomizer
              columns={columns}
              visibleKeys={visibleColumnKeys}
              onToggle={onToggleColumn}
              onShowAll={onShowAllColumns}
              onReset={onResetColumns}
            />
          )}

          {/* Density Toggle */}
          {onToggleDensity && (
            <button
              type="button"
              onClick={onToggleDensity}
              title={density === "compact" ? "Switch to comfortable view" : "Switch to compact view"}
              aria-label="Toggle table density"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Rows3 className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden md:inline">{density === "compact" ? "Compact" : "Comfortable"}</span>
            </button>
          )}

          {/* View Mode Switcher */}
          {onViewModeChange && (
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => onViewModeChange("table")}
                title="Table view"
                className={cn(
                  "p-1.5 rounded-md text-slate-500 transition-colors",
                  viewMode === "table"
                    ? "bg-slate-100 text-slate-900 font-bold dark:bg-slate-800 dark:text-white"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800",
                )}
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("grid")}
                title="Card grid view"
                className={cn(
                  "p-1.5 rounded-md text-slate-500 transition-colors",
                  viewMode === "grid"
                    ? "bg-slate-100 text-slate-900 font-bold dark:bg-slate-800 dark:text-white"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800",
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Multi-Format Export Dropdown */}
          {(onExportCsv || onExportExcel || onPrint) && (
            <div ref={exportRef} className="relative inline-block text-left">
              <button
                type="button"
                onClick={() => setExportOpen((prev) => !prev)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Export</span>
              </button>

              {exportOpen && (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-44 origin-top-right rounded-xl border border-slate-200 bg-white p-1 shadow-xl animate-in fade-in zoom-in-95 duration-150 dark:border-slate-800 dark:bg-slate-900">
                  {onExportCsv && (
                    <button
                      type="button"
                      onClick={() => {
                        setExportOpen(false);
                        onExportCsv();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <FileText className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Export as CSV</span>
                    </button>
                  )}
                  {onExportExcel && (
                    <button
                      type="button"
                      onClick={() => {
                        setExportOpen(false);
                        onExportExcel();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Export as Excel</span>
                    </button>
                  )}
                  {onPrint && (
                    <button
                      type="button"
                      onClick={() => {
                        setExportOpen(false);
                        onPrint();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Printer className="h-3.5 w-3.5 text-blue-600" />
                      <span>Print Document</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Refresh Tool */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh data"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin text-blue-600")} />
            </button>
          )}

          {/* Action button slots */}
          {actions}
        </div>
      </div>

      {/* Record Counter Info Strip */}
      {(typeof filteredCount === "number" || typeof totalCount === "number") && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-0.5">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredCount ?? totalCount}</strong>
            {typeof totalCount === "number" && filteredCount !== totalCount ? ` of ${totalCount}` : ""}{" "}
            records
          </span>
        </div>
      )}
    </div>
  );
}
