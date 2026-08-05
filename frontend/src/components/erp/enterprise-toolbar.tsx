"use client";

import * as React from "react";
import {
  Plus,
  Download,
  Upload,
  Printer,
  Trash2,
  RefreshCw,
  Filter,
  Columns3,
  SlidersHorizontal,
  Archive,
  MoreHorizontal,
  CheckSquare,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type EnterpriseToolbarProps = {
  /** Title of the current module view */
  title?: string;
  /** Subtitle or record count description */
  subtitle?: string;
  /** Search query state */
  searchValue?: string;
  /** Search query handler */
  onSearchChange?: (value: string) => void;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Add new record handler */
  onNewRecord?: () => void;
  /** Label for new record button */
  newRecordLabel?: string;
  /** Import handler */
  onImport?: () => void;
  /** Export handler */
  onExport?: () => void;
  /** Print handler */
  onPrint?: () => void;
  /** Refresh handler */
  onRefresh?: () => void;
  /** Delete handler for selected records */
  onDeleteSelected?: () => void;
  /** Number of currently selected rows */
  selectedCount?: number;
  /** Filter drawer / toggle handler */
  onToggleFilter?: () => void;
  /** Active filter count */
  activeFilterCount?: number;
  /** Column customization handler */
  onToggleColumns?: () => void;
  /** Additional custom actions */
  actions?: React.ReactNode;
};

export function EnterpriseToolbar({
  title,
  subtitle,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search records...",
  onNewRecord,
  newRecordLabel = "New",
  onImport,
  onExport,
  onPrint,
  onRefresh,
  onDeleteSelected,
  selectedCount = 0,
  onToggleFilter,
  activeFilterCount = 0,
  onToggleColumns,
  actions,
}: EnterpriseToolbarProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    onRefresh?.();
    window.setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Title / Info / Selection Counter */}
        <div className="flex items-center gap-3 min-w-0">
          {selectedCount > 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-300">
              <CheckSquare className="h-3.5 w-3.5" />
              <span>{selectedCount} item{selectedCount > 1 ? "s" : ""} selected</span>
              {onDeleteSelected && (
                <button
                  onClick={onDeleteSelected}
                  className="ml-2 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold text-rose-600 hover:bg-rose-100 dark:text-rose-400 dark:hover:bg-rose-950/60"
                  title="Delete selected items"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              )}
            </div>
          ) : (
            title && (
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                    {title}
                  </h2>
                  {subtitle && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {subtitle}
                    </span>
                  )}
                </div>
              </div>
            )
          )}

          {/* Quick Search Input */}
          {onSearchChange && (
            <div className="relative flex items-center min-w-[200px] sm:min-w-[260px]">
              <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-8 w-full rounded-lg border-slate-200 bg-slate-50/60 pl-8 pr-7 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
              {searchValue && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Primary New Action */}
          {onNewRecord && (
            <Button
              onClick={onNewRecord}
              size="sm"
              className="h-8 gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{newRecordLabel}</span>
            </Button>
          )}

          {/* Filters Button */}
          {onToggleFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleFilter}
              className="h-8 gap-1.5 rounded-lg border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
            >
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}

          {/* Columns Toggle Button */}
          {onToggleColumns && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleColumns}
              className="h-8 gap-1.5 rounded-lg border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
              title="Customize columns"
            >
              <Columns3 className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Columns</span>
            </Button>
          )}

          {/* Import / Export / Print Tools */}
          {onImport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onImport}
              className="h-8 gap-1.5 rounded-lg border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
              title="Import data"
            >
              <Upload className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Import</span>
            </Button>
          )}

          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="h-8 gap-1.5 rounded-lg border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
              title="Export data to CSV/Excel"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}

          {onPrint && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPrint}
              className="h-8 px-2.5 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
              title="Print record view"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
            </Button>
          )}

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="h-8 px-2.5 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
              title="Refresh workspace data"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          )}

          {/* Additional Action Injection */}
          {actions}
        </div>
      </div>
    </div>
  );
}
