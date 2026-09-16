"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, IndianRupee } from "lucide-react";
import apiClient from "@/services/apiClient";
import type { DynamicLineItemColumn, DynamicLineItemSection, DynamicSelectOption } from "@/lib/dynamic-schema/types";
import { cn } from "@/lib/utils";

interface DynamicLineItemsEditorProps {
  config: DynamicLineItemSection;
  items: Record<string, any>[];
  onChange: (items: Record<string, any>[]) => void;
  disabled?: boolean;
}

export function DynamicLineItemsEditor({
  config,
  items,
  onChange,
  disabled = false,
}: DynamicLineItemsEditorProps) {
  // Cache lookup options for columns that specify optionsEndpoint
  const [lookupOptions, setLookupOptions] = useState<Record<string, DynamicSelectOption[]>>({});

  useEffect(() => {
    let isMounted = true;
    for (const col of config.columns) {
      if (col.dataType === "lookup" && col.optionsEndpoint && !lookupOptions[col.key]) {
        apiClient
          .get(col.optionsEndpoint)
          .then((res) => {
            if (!isMounted) return;
            const raw = res.data?.items ?? res.data?.data ?? res.data;
            if (Array.isArray(raw)) {
              const valKey = col.lookupValueKey || "id";
              const lblKey = col.lookupLabelKey || "name";
              const opts: DynamicSelectOption[] = raw.map((item: any) => ({
                value: String(item[valKey] ?? item.id ?? ""),
                label: String(item[lblKey] ?? item.name ?? item.title ?? "Unnamed"),
              }));
              setLookupOptions((prev) => ({ ...prev, [col.key]: opts }));
            }
          })
          .catch(() => {
            // Ignore error
          });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [config.columns, lookupOptions]);

  const handleCellChange = (rowIndex: number, colKey: string, val: any) => {
    const updated = items.map((row, idx) => {
      if (idx !== rowIndex) return row;
      const nextRow = { ...row, [colKey]: val };

      // Evaluate formula if any
      for (const col of config.columns) {
        if (col.formula) {
          const qty = parseFloat(nextRow.quantity ?? nextRow.qty ?? 0) || 0;
          const price = parseFloat(nextRow.unitPrice ?? nextRow.price ?? nextRow.rate ?? 0) || 0;
          const discount = parseFloat(nextRow.discount ?? 0) || 0;
          const tax = parseFloat(nextRow.taxRate ?? nextRow.tax ?? 0) || 0;

          if (col.formula === "quantity * unitPrice") {
            nextRow[col.key] = Math.max(0, qty * price);
          } else if (col.formula === "(quantity * unitPrice) - discount") {
            nextRow[col.key] = Math.max(0, (qty * price) - discount);
          } else if (col.formula === "withTax") {
            const base = (qty * price) - discount;
            nextRow[col.key] = base + (base * (tax / 100));
          }
        }
      }
      return nextRow;
    });

    onChange(updated);
  };

  const handleAddRow = () => {
    const newRow: Record<string, any> = {};
    for (const col of config.columns) {
      newRow[col.key] = col.dataType === "number" || col.dataType === "currency" ? 0 : "";
    }
    onChange([...items, newRow]);
  };

  const handleDeleteRow = (rowIndex: number) => {
    onChange(items.filter((_, idx) => idx !== rowIndex));
  };

  // Compute grand total of all lines
  const grandTotal = items.reduce((sum, row) => {
    const lineTotal = parseFloat(row.total ?? row.lineTotal ?? row.amount ?? 0) || 0;
    return sum + lineTotal;
  }, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            {config.title}
          </h5>
          {config.description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{config.description}</p>
          )}
        </div>
        {config.allowAdd !== false && !disabled && (
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Line
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs bg-white dark:bg-slate-900">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              {config.columns.map((col) => (
                <th
                  key={col.key}
                  className="py-2.5 px-3 font-semibold"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label} {col.required && <span className="text-rose-500">*</span>}
                </th>
              ))}
              {config.allowDelete !== false && !disabled && (
                <th className="py-2.5 px-3 w-12 text-center">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={config.columns.length + (config.allowDelete !== false ? 2 : 1)}
                  className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs"
                >
                  No line items added yet. Click &quot;Add Line&quot; to begin.
                </td>
              </tr>
            ) : (
              items.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                    {rowIdx + 1}
                  </td>
                  {config.columns.map((col) => {
                    const cellVal = row[col.key] ?? "";
                    return (
                      <td key={col.key} className="py-2 px-3">
                        {col.readOnly || col.formula ? (
                          <span className={cn(
                            "inline-block font-mono text-xs font-semibold py-1 px-2 rounded bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
                            col.dataType === "currency" && "text-emerald-700 dark:text-emerald-400 font-bold"
                          )}>
                            {col.dataType === "currency"
                              ? `₹ ${Number(cellVal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : String(cellVal)}
                          </span>
                        ) : col.dataType === "lookup" || col.dataType === "select" ? (
                          <select
                            value={cellVal}
                            disabled={disabled}
                            onChange={(e) => handleCellChange(rowIdx, col.key, e.target.value)}
                            className="erp-input text-xs py-1 px-2"
                          >
                            <option value="">{col.placeholder || `Select ${col.label}…`}</option>
                            {(lookupOptions[col.key] || col.options || []).map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : col.dataType === "number" || col.dataType === "currency" ? (
                          <input
                            type="number"
                            value={cellVal}
                            placeholder={col.placeholder || "0"}
                            disabled={disabled}
                            onChange={(e) => handleCellChange(rowIdx, col.key, parseFloat(e.target.value) || 0)}
                            className="erp-input text-xs py-1 px-2 font-mono text-right"
                          />
                        ) : (
                          <input
                            type="text"
                            value={cellVal}
                            placeholder={col.placeholder || `Enter ${col.label}…`}
                            disabled={disabled}
                            onChange={(e) => handleCellChange(rowIdx, col.key, e.target.value)}
                            className="erp-input text-xs py-1 px-2"
                          />
                        )}
                      </td>
                    );
                  })}
                  {config.allowDelete !== false && !disabled && (
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(rowIdx)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                        title="Remove line"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {items.length > 0 && (
        <div className="flex justify-end pt-1">
          <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 flex items-center gap-4 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Total Lines: {items.length}</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
              <span>Lines Total:</span>
              <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                ₹ {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
