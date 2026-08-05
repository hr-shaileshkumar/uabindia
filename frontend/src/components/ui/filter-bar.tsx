"use client";

import { useState } from "react";
import { Search, X, Filter, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}

interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: FilterOption[];
  activeFilters?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onResetFilters?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  filters = [],
  activeFilters = {},
  onFilterChange,
  onResetFilters,
  actions,
  className,
}: FilterBarProps) {
  const activeCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <div className={cn("flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card shadow-sm", className)}>
      <div className="flex flex-1 items-center gap-2 min-w-0">
        {onSearchChange && (
          <div className="relative flex-1 max-w-xs sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-9 pl-9 pr-8 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {filters.map((filter) => (
          <select
            key={filter.key}
            value={activeFilters[filter.key] || ""}
            onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
            className="h-9 px-3 rounded-lg border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          >
            <option value="">{filter.label}: All</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}

        {activeCount > 0 && onResetFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 h-9 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            title="Reset filters"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset ({activeCount})</span>
          </button>
        )}
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
