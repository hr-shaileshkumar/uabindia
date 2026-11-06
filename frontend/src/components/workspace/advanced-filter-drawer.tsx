"use client";

import { useState, useEffect } from "react";
import { Filter, Plus, Trash2, Check, RotateCcw } from "lucide-react";
import { SideDrawer } from "@/components/ui/side-drawer";
import { buttonClassName } from "@/components/workspace/styles";
import {
  LIST_FILTER_OPERATORS,
  createListFilterRule,
  type ErpListColumn,
  type ErpListFilterRule,
  type ListFilterOperator,
} from "@/lib/workspace/list-view";
import { cn } from "@/lib/utils";

export interface AdvancedFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  columns: ErpListColumn[];
  filters: ErpListFilterRule[];
  onApply: (filters: ErpListFilterRule[]) => void;
}

export function AdvancedFilterDrawer({
  open,
  onClose,
  columns,
  filters,
  onApply,
}: AdvancedFilterDrawerProps) {
  const [draftRules, setDraftRules] = useState<ErpListFilterRule[]>(filters);

  useEffect(() => {
    setDraftRules(filters);
  }, [filters, open]);

  const filterableColumns = columns.filter(
    (col) => col.filterable !== false && !col.locked,
  );

  const addRule = () => {
    const defaultCol = filterableColumns[0]?.key ?? columns[0]?.key ?? "";
    setDraftRules((prev) => [...prev, createListFilterRule(defaultCol)]);
  };

  const updateRule = (
    id: string,
    field: keyof ErpListFilterRule,
    value: string,
  ) => {
    setDraftRules((prev) =>
      prev.map((rule) => (rule.id === id ? { ...rule, [field]: value } : rule)),
    );
  };

  const removeRule = (id: string) => {
    setDraftRules((prev) => prev.filter((rule) => rule.id !== id));
  };

  const handleApply = () => {
    const validRules = draftRules.filter((r) =>
      ["empty", "nempty"].includes(r.operator) ? true : r.value.trim() !== "",
    );
    onApply(validRules);
    onClose();
  };

  const handleClearAll = () => {
    setDraftRules([]);
    onApply([]);
    onClose();
  };

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title="Advanced Filters"
      subtitle="Build complex filter rules to refine your view"
      width="lg"
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear All Filters
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={buttonClassName.secondary}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className={cn(buttonClassName.primary, "gap-1.5")}
            >
              <Check className="h-3.5 w-3.5" />
              Apply Filters
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {draftRules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center dark:border-slate-800 dark:bg-slate-900/40">
            <Filter className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              No active filter rules
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Add your first condition to filter this dataset.
            </p>
            <button
              type="button"
              onClick={addRule}
              className={cn(buttonClassName.primary, "mt-4 gap-1.5 text-xs")}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Condition
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {draftRules.map((rule, index) => {
              const requiresValue = !["empty", "nempty"].includes(rule.operator);
              return (
                <div
                  key={rule.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:w-12">
                    {index === 0 ? "Where" : "And"}
                  </span>

                  {/* Column Select */}
                  <select
                    value={rule.columnKey}
                    onChange={(e) => updateRule(rule.id, "columnKey", e.target.value)}
                    aria-label="Filter column"
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:w-44"
                  >
                    {filterableColumns.map((col) => (
                      <option key={col.key} value={col.key}>
                        {col.label}
                      </option>
                    ))}
                  </select>

                  {/* Operator Select */}
                  <select
                    value={rule.operator}
                    onChange={(e) =>
                      updateRule(rule.id, "operator", e.target.value as ListFilterOperator)
                    }
                    aria-label="Filter operator"
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:w-36"
                  >
                    {LIST_FILTER_OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  {/* Value Input */}
                  {requiresValue ? (
                    <input
                      type="text"
                      value={rule.value}
                      onChange={(e) => updateRule(rule.id, "value", e.target.value)}
                      placeholder="Enter value…"
                      className="h-8 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  ) : (
                    <span className="flex-1 text-xs italic text-slate-400 px-2">
                      (No value needed)
                    </span>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => removeRule(rule.id)}
                    aria-label="Remove condition"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={addRule}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Condition
            </button>
          </div>
        )}
      </div>
    </SideDrawer>
  );
}
