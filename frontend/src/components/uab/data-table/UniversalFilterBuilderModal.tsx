"use client";

import React, { useState } from "react";
import {
  type FilterGroup,
  type FilterCondition,
  type FilterOperator,
  type FilterAstNode,
  createEmptyFilterGroup,
  filterAstToHumanReadable,
  isFilterGroup,
} from "@/lib/filter-engine/filter-ast";
import { Plus, Trash2, X, Filter, CornerDownRight, RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterColumnOption {
  key: string;
  label: string;
  type?: "string" | "number" | "date" | "boolean" | "select" | string;
}

export interface UniversalFilterBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: FilterColumnOption[];
  initialAst?: FilterGroup | null;
  onApply: (ast: FilterGroup) => void;
}

const OPERATOR_OPTIONS: { value: FilterOperator; label: string; textOnly?: boolean; numOnly?: boolean }[] = [
  { value: "eq", label: "Equals (=)" },
  { value: "neq", label: "Does Not Equal (≠)" },
  { value: "contains", label: "Contains", textOnly: true },
  { value: "ncontains", label: "Does Not Contain", textOnly: true },
  { value: "starts", label: "Starts With", textOnly: true },
  { value: "ends", label: "Ends With", textOnly: true },
  { value: "gt", label: "Greater Than (>)", numOnly: true },
  { value: "gte", label: "Greater Than or Equal (≥)", numOnly: true },
  { value: "lt", label: "Less Than (<)", numOnly: true },
  { value: "lte", label: "Less Than or Equal (≤)", numOnly: true },
  { value: "empty", label: "Is Empty" },
  { value: "nempty", label: "Is Not Empty" },
  { value: "in", label: "In List (comma separated)" },
];

export function UniversalFilterBuilderModal({
  isOpen,
  onClose,
  columns,
  initialAst,
  onApply,
}: UniversalFilterBuilderModalProps) {
  const [rootGroup, setRootGroup] = useState<FilterGroup>(() => {
    if (initialAst && initialAst.rules.length > 0) {
      return JSON.parse(JSON.stringify(initialAst));
    }
    const empty = createEmptyFilterGroup("AND");
    if (columns.length > 0) {
      empty.rules.push({
        id: `cond_${Date.now()}`,
        field: columns[0].key,
        operator: "eq",
        value: "",
      });
    }
    return empty;
  });

  if (!isOpen) return null;

  const fieldLabels: Record<string, string> = {};
  columns.forEach((c) => {
    fieldLabels[c.key] = c.label || c.key;
  });

  const previewString = filterAstToHumanReadable(rootGroup, fieldLabels);

  const handleApply = () => {
    onApply(rootGroup);
    onClose();
  };

  const handleReset = () => {
    const empty = createEmptyFilterGroup("AND");
    if (columns.length > 0) {
      empty.rules.push({
        id: `cond_${Date.now()}`,
        field: columns[0].key,
        operator: "eq",
        value: "",
      });
    }
    setRootGroup(empty);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Universal Filter Builder (AST)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compose nested (A AND B) OR (C AND D) compound query expressions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Expression Preview */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="font-semibold text-slate-400 shrink-0 uppercase tracking-wider text-[10px]">
            Expression Preview:
          </span>
          {previewString ? (
            <code className="text-indigo-600 dark:text-indigo-400 font-mono font-medium truncate">
              {previewString}
            </code>
          ) : (
            <span className="italic text-slate-400 text-xs">No active filters configured</span>
          )}
        </div>

        {/* Filter Rule Builder Node Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <FilterGroupNode
            group={rootGroup}
            columns={columns}
            onChange={(updated) => setRootGroup(updated)}
            isRoot={true}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-6 py-3.5 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Filters</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
            >
              <Check className="h-4 w-4" />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Recursive Group Component ────────────────────────────────────────────────

interface FilterGroupNodeProps {
  group: FilterGroup;
  columns: FilterColumnOption[];
  onChange: (updated: FilterGroup) => void;
  onDelete?: () => void;
  isRoot?: boolean;
}

function FilterGroupNode({ group, columns, onChange, onDelete, isRoot = false }: FilterGroupNodeProps) {
  const toggleCombinator = (next: "AND" | "OR") => {
    onChange({ ...group, combinator: next });
  };

  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: `cond_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      field: columns[0]?.key || "id",
      operator: "eq",
      value: "",
    };
    onChange({ ...group, rules: [...group.rules, newCondition] });
  };

  const addSubGroup = () => {
    const newSubGroup = createEmptyFilterGroup(group.combinator === "AND" ? "OR" : "AND");
    if (columns.length > 0) {
      newSubGroup.rules.push({
        id: `cond_${Date.now()}`,
        field: columns[0].key,
        operator: "eq",
        value: "",
      });
    }
    onChange({ ...group, rules: [...group.rules, newSubGroup] });
  };

  const updateChild = (index: number, updatedChild: FilterAstNode) => {
    const nextRules = [...group.rules];
    nextRules[index] = updatedChild;
    onChange({ ...group, rules: nextRules });
  };

  const removeChild = (index: number) => {
    const nextRules = group.rules.filter((_, i) => i !== index);
    onChange({ ...group, rules: nextRules });
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-3 transition-colors",
        isRoot
          ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60"
          : "border-indigo-100 bg-indigo-50/30 dark:border-indigo-900/40 dark:bg-indigo-950/20"
      )}
    >
      {/* Group Header Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {isRoot ? "Match Condition:" : "Match Sub-Group:"}
          </span>
          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => toggleCombinator("AND")}
              className={cn(
                "px-2.5 py-0.5 text-xs font-bold rounded-md transition-all",
                group.combinator === "AND"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              AND (All)
            </button>
            <button
              type="button"
              onClick={() => toggleCombinator("OR")}
              className={cn(
                "px-2.5 py-0.5 text-xs font-bold rounded-md transition-all",
                group.combinator === "OR"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              OR (Any)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={addCondition}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Condition</span>
          </button>
          <button
            type="button"
            onClick={addSubGroup}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <CornerDownRight className="h-3.5 w-3.5" />
            <span>Group</span>
          </button>
          {!isRoot && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Delete group"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Rules list */}
      <div className="space-y-2.5 pl-2 border-l-2 border-slate-200 dark:border-slate-800">
        {group.rules.map((rule, idx) => (
          <div key={rule.id || idx}>
            {isFilterGroup(rule) ? (
              <FilterGroupNode
                group={rule}
                columns={columns}
                onChange={(updated) => updateChild(idx, updated)}
                onDelete={() => removeChild(idx)}
                isRoot={false}
              />
            ) : (
              <FilterConditionRow
                condition={rule}
                columns={columns}
                onChange={(updated) => updateChild(idx, updated)}
                onDelete={() => removeChild(idx)}
              />
            )}
          </div>
        ))}

        {group.rules.length === 0 && (
          <div className="py-3 text-center text-xs text-slate-400 italic">
            No conditions in this group. Click &quot;+ Condition&quot; above to add one.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Single Condition Row ─────────────────────────────────────────────────────

interface FilterConditionRowProps {
  condition: FilterCondition;
  columns: FilterColumnOption[];
  onChange: (updated: FilterCondition) => void;
  onDelete: () => void;
}

function FilterConditionRow({ condition, columns, onChange, onDelete }: FilterConditionRowProps) {
  const selectedCol = columns.find((c) => c.key === condition.field);
  const isText = !selectedCol?.type || selectedCol.type === "string";
  const isNum = selectedCol?.type === "number" || selectedCol?.type === "currency";

  const availableOperators = OPERATOR_OPTIONS.filter((op) => {
    if (op.textOnly && !isText) return false;
    if (op.numOnly && !isNum) return false;
    return true;
  });

  const hideValueInput = condition.operator === "empty" || condition.operator === "nempty";

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
      {/* Field selector */}
      <select
        value={condition.field}
        onChange={(e) => onChange({ ...condition, field: e.target.value })}
        className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium shrink-0"
      >
        {columns.map((col) => (
          <option key={col.key} value={col.key}>
            {col.label || col.key}
          </option>
        ))}
      </select>

      {/* Operator selector */}
      <select
        value={condition.operator}
        onChange={(e) => onChange({ ...condition, operator: e.target.value as FilterOperator })}
        className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 shrink-0"
      >
        {availableOperators.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      {/* Value Input */}
      {!hideValueInput ? (
        <input
          type={isNum ? "number" : "text"}
          value={condition.value ?? ""}
          onChange={(e) => onChange({ ...condition, value: e.target.value })}
          placeholder="Filter value..."
          className="h-8 flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-0"
        />
      ) : (
        <div className="h-8 flex-1 flex items-center px-2.5 text-xs italic text-slate-400">
          (No value required)
        </div>
      )}

      {/* Delete button */}
      <button
        type="button"
        onClick={onDelete}
        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
        title="Remove condition"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
