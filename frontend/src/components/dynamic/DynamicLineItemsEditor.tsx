"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Copy, ArrowUp, ArrowDown, Calculator } from "lucide-react";
import apiClient from "@/services/apiClient";
import type { DynamicLineItemColumn, DynamicLineItemSection, DynamicSelectOption } from "@/lib/dynamic-schema/types";
import { cn } from "@/lib/utils";

/**
 * Safe arithmetic expression evaluator for ERP line item formulas.
 * Evaluates expressions like:
 *   "quantity * unitPrice"
 *   "(quantity * unitPrice) - discount"
 *   "qty * rate * (1 + tax / 100)"
 *   "amount * 0.18"
 * Replaces row variables with numeric values and performs safe calculation without eval().
 */
export function evaluateLineFormula(formula: string, row: Record<string, any>): number {
  if (!formula || typeof formula !== "string" || !formula.trim()) return 0;
  let expr = formula.trim();

  // Backward compatibility alias for "withTax"
  if (expr.toLowerCase() === "withtax") {
    const qty = parseFloat(row.quantity ?? row.qty ?? 0) || 0;
    const price = parseFloat(row.unitPrice ?? row.price ?? row.rate ?? 0) || 0;
    const discount = parseFloat(row.discount ?? 0) || 0;
    const tax = parseFloat(row.taxRate ?? row.tax ?? 0) || 0;
    const base = qty * price - discount;
    return Math.max(0, base + base * (tax / 100));
  }

  // Common field aliases normalization
  const aliases: Record<string, any> = {
    quantity: row.quantity ?? row.qty ?? 0,
    qty: row.quantity ?? row.qty ?? 0,
    unitprice: row.unitPrice ?? row.price ?? row.rate ?? 0,
    price: row.unitPrice ?? row.price ?? row.rate ?? 0,
    rate: row.unitPrice ?? row.price ?? row.rate ?? 0,
    discount: row.discount ?? 0,
    taxrate: row.taxRate ?? row.tax ?? 0,
    tax: row.taxRate ?? row.tax ?? 0,
    amount: row.amount ?? 0,
    subtotal: row.subtotal ?? row.baseAmount ?? 0,
  };

  // Replace variable identifiers with actual numeric values
  expr = expr.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (match) => {
    const keyLower = match.toLowerCase();
    if (keyLower in aliases) {
      return String(parseFloat(aliases[keyLower]) || 0);
    }
    if (match in row) {
      return String(parseFloat(row[match]) || 0);
    }
    return "0";
  });

  // Ensure expression only contains numbers, operators, dots, parentheses, and spaces
  if (!/^[0-9+\-*/().\s%]+$/.test(expr)) {
    return 0;
  }

  try {
    const sanitized = expr.replace(/(\d+)%/g, "($1/100)");
    const result = new Function(`"use strict"; return (${sanitized});`)();
    return typeof result === "number" && !isNaN(result) && isFinite(result)
      ? Math.round(result * 10000) / 10000
      : 0;
  } catch {
    return 0;
  }
}

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
          nextRow[col.key] = evaluateLineFormula(col.formula, nextRow);
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

  const handleDuplicateRow = (rowIndex: number) => {
    const source = items[rowIndex];
    if (!source) return;
    const cloned = { ...source, id: undefined };
    const next = [...items];
    next.splice(rowIndex + 1, 0, cloned);
    onChange(next);
  };

  const handleMoveRow = (rowIndex: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? rowIndex - 1 : rowIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(rowIndex, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
  };

  const handleDeleteRow = (rowIndex: number) => {
    onChange(items.filter((_, idx) => idx !== rowIndex));
  };

  // Compute breakdown totals
  const totals = items.reduce(
    (acc, row) => {
      const qty = parseFloat(row.quantity ?? row.qty ?? 1) || 1;
      const price = parseFloat(row.unitPrice ?? row.price ?? row.rate ?? 0) || 0;
      const discount = parseFloat(row.discount ?? 0) || 0;
      const taxRate = parseFloat(row.taxRate ?? row.tax ?? 0) || 0;

      const taxable = Math.max(0, qty * price - discount);
      const taxAmount = taxable * (taxRate / 100);
      const lineTotal = parseFloat(row.total ?? row.lineTotal ?? row.amount ?? taxable + taxAmount) || taxable + taxAmount;

      acc.subtotal += taxable;
      acc.taxAmount += taxAmount;
      acc.grandTotal += lineTotal;
      return acc;
    },
    { subtotal: 0, taxAmount: 0, grandTotal: 0 }
  );

  return (
    <div className="space-y-3">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Calculator className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>{config.title}</span>
          </h5>
          {config.description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{config.description}</p>
          )}
        </div>
        {config.allowAdd !== false && !disabled && (
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-2xs transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Line
          </button>
        )}
      </div>

      {/* Line Items Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs bg-white dark:bg-slate-900">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[10px] tracking-wider">
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
                <th className="py-2.5 px-3 w-24 text-center">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={config.columns.length + (config.allowDelete !== false ? 2 : 1)}
                  className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs"
                >
                  <p className="font-medium text-slate-600 dark:text-slate-300">No line items added yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click &quot;Add Line&quot; to insert the first row.</p>
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
                          <span
                            className={cn(
                              "inline-block font-mono text-xs font-semibold py-1 px-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
                              col.dataType === "currency" && "text-emerald-700 dark:text-emerald-400 font-bold"
                            )}
                          >
                            {col.dataType === "currency"
                              ? `₹ ${Number(cellVal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : String(cellVal)}
                          </span>
                        ) : col.dataType === "lookup" || col.dataType === "select" ? (
                          <select
                            id={`line-${rowIdx}-${col.key}`}
                            name={`line_${rowIdx}_${col.key}`}
                            value={cellVal}
                            disabled={disabled}
                            onChange={(e) => handleCellChange(rowIdx, col.key, e.target.value)}
                            className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
                            id={`line-${rowIdx}-${col.key}`}
                            name={`line_${rowIdx}_${col.key}`}
                            type="number"
                            value={cellVal}
                            placeholder={col.placeholder || "0"}
                            disabled={disabled}
                            onChange={(e) => handleCellChange(rowIdx, col.key, parseFloat(e.target.value) || 0)}
                            className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-200 bg-white font-mono text-right text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          />
                        ) : (
                          <input
                            id={`line-${rowIdx}-${col.key}`}
                            name={`line_${rowIdx}_${col.key}`}
                            type="text"
                            value={cellVal}
                            placeholder={col.placeholder || `Enter ${col.label}…`}
                            disabled={disabled}
                            onChange={(e) => handleCellChange(rowIdx, col.key, e.target.value)}
                            className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          />
                        )}
                      </td>
                    );
                  })}
                  {config.allowDelete !== false && !disabled && (
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateRow(rowIdx)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors"
                          title="Duplicate line"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={rowIdx === 0}
                          onClick={() => handleMoveRow(rowIdx, "up")}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-30 transition-colors"
                          title="Move up"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={rowIdx === items.length - 1}
                          onClick={() => handleMoveRow(rowIdx, "down")}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-30 transition-colors"
                          title="Move down"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(rowIdx)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                          title="Delete line"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Enterprise Totals Breakdown Strip */}
      {items.length > 0 && (
        <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700/80 gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <span>Total Lines: <strong className="text-slate-800 dark:text-slate-200">{items.length}</strong></span>
          </div>

          <div className="flex items-center gap-5 font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Taxable Subtotal</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                ₹ {totals.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {totals.taxAmount > 0 && (
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">GST Tax</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  ₹ {totals.taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div className="pl-3 border-l border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">Net Total</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                ₹ {totals.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
