"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, Plus, X } from "lucide-react";
import {
  LIST_FILTER_OPERATORS,
  createListFilterRule,
  type ErpListColumn,
  type ErpListFilterRule,
} from "@/lib/workspace/list-view";

export function ErpListFilterBar({
  columns,
  filters,
  onChange,
  extra,
}: {
  columns: ErpListColumn[];
  filters: ErpListFilterRule[];
  onChange: (next: ErpListFilterRule[]) => void;
  extra?: ReactNode;
}) {
  const [draftFilters, setDraftFilters] = useState<ErpListFilterRule[]>(filters);
  const [isExpanded, setIsExpanded] = useState(filters.length > 0);

  useEffect(() => {
    setDraftFilters(filters);
    if (filters.length > 0) setIsExpanded(true);
  }, [filters]);

  const filterable = columns.filter((column) => column.filterable !== false && !column.locked);

  const addFilter = () => {
    const first = filterable[0]?.key ?? columns[0]?.key ?? "";
    const updated = [...draftFilters, createListFilterRule(first)];
    setDraftFilters(updated);
    setIsExpanded(true);
  };

  const applyFilters = () => {
    onChange(draftFilters);
  };

  const clearAll = () => {
    setDraftFilters([]);
    onChange([]);
    setIsExpanded(false);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Top Left-Aligned Controls Row */}
      <div className="flex flex-wrap items-center gap-2">
        {extra}
        <button
          type="button"
          onClick={addFilter}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add filter
        </button>

        {draftFilters.length > 0 ? (
          <>
            <button
              type="button"
              onClick={applyFilters}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              Apply
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-rose-600 shadow-2xs hover:bg-rose-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          </>
        ) : null}
      </div>

      {/* Expanded Filter Rules Rows */}
      {isExpanded && draftFilters.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-lg border border-slate-200/90 bg-slate-50/70 p-2.5">
          {draftFilters.map((rule) => (
            <div key={rule.id} className="grid gap-2 sm:grid-cols-[minmax(8rem,12rem)_minmax(8rem,11rem)_minmax(8rem,1fr)_auto]">
              <select
                className="erp-select"
                value={rule.columnKey}
                onChange={(event) =>
                  setDraftFilters(draftFilters.map((item) => (item.id === rule.id ? { ...item, columnKey: event.target.value } : item)))
                }
              >
                {filterable.map((column) => (
                  <option key={column.key} value={column.key}>
                    {column.label}
                  </option>
                ))}
              </select>
              <select
                className="erp-select"
                value={rule.operator}
                onChange={(event) =>
                  setDraftFilters(
                    draftFilters.map((item) =>
                      item.id === rule.id ? { ...item, operator: event.target.value as ErpListFilterRule["operator"] } : item,
                    ),
                  )
                }
              >
                {LIST_FILTER_OPERATORS.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
              {rule.operator === "empty" || rule.operator === "nempty" ? (
                <div className="flex h-8 items-center text-xs text-slate-500">No value needed</div>
              ) : (
                <input
                  className="erp-input"
                  value={rule.value}
                  placeholder="Filter value"
                  onChange={(event) =>
                    setDraftFilters(draftFilters.map((item) => (item.id === rule.id ? { ...item, value: event.target.value } : item)))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyFilters();
                  }}
                />
              )}
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                aria-label="Remove filter"
                onClick={() => {
                  const remaining = draftFilters.filter((item) => item.id !== rule.id);
                  setDraftFilters(remaining);
                  if (remaining.length === 0) {
                    onChange([]);
                    setIsExpanded(false);
                  }
                }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
