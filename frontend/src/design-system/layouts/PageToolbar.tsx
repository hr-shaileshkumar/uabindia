"use client";

import type { ReactNode } from "react";
import { Search, Download, Upload, RefreshCw, Trash2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface PageToolbarProps {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  statusValue?: string;
  onStatusChange?: (val: string) => void;
  statusOptions?: Array<{ label: string; value: string }>;
  showDeleted?: boolean;
  onToggleDeleted?: () => void;
  selectedCount?: number;
  onBulkDelete?: () => void;
  onBulkRestore?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onRefresh?: () => void;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  filterSlot?: ReactNode;
}

export function PageToolbar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search records...",
  statusValue,
  onStatusChange,
  statusOptions = [],
  showDeleted = false,
  onToggleDeleted,
  selectedCount = 0,
  onBulkDelete,
  onBulkRestore,
  onExport,
  onImport,
  onRefresh,
  primaryAction,
  secondaryActions,
  filterSlot,
}: PageToolbarProps) {
  return (
    <div className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search & Select Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {onSearchChange ? (
            <div className="relative min-w-[200px] max-w-xs flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-9 pl-9 pr-3 text-sm rounded-lg border-slate-300 dark:border-slate-700 bg-background"
              />
            </div>
          ) : null}

          {statusOptions.length > 0 && onStatusChange ? (
            <select
              value={statusValue || "all"}
              onChange={(e) => onStatusChange(e.target.value)}
              className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-background text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : null}

          {filterSlot}

          {onToggleDeleted ? (
            <Button
              variant={showDeleted ? "secondary" : "outline"}
              size="sm"
              onClick={onToggleDeleted}
              className="h-9 text-xs"
            >
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
              {showDeleted ? "Hide Deleted" : "Show Deleted"}
            </Button>
          ) : null}
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-2">
          {selectedCount > 0 && onBulkDelete ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
              className="h-9 text-xs font-medium"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete Selected ({selectedCount})
            </Button>
          ) : null}

          {selectedCount > 0 && onBulkRestore ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkRestore}
              className="h-9 text-xs font-medium text-emerald-600 dark:text-emerald-400 border-emerald-300 hover:bg-emerald-50"
            >
              Restore Selected ({selectedCount})
            </Button>
          ) : null}

          {secondaryActions}

          {onRefresh ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="h-9 text-xs px-2.5"
              title="Refresh Registry Data"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          ) : null}

          {onExport ? (
            <Button variant="outline" size="sm" onClick={onExport} className="h-9 text-xs hidden sm:flex">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export
            </Button>
          ) : null}

          {onImport ? (
            <Button variant="outline" size="sm" onClick={onImport} className="h-9 text-xs hidden sm:flex">
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Import
            </Button>
          ) : null}

          {primaryAction}
        </div>
      </div>
    </div>
  );
}
