"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { erpButtonClassName } from "@/components/workspace/styles";
import type { DiscountScheme, DocLine, MasterOption } from "../types";
import {
  emptyDocLine,
  formatInr,
  formatSchemeDiscount,
  lineAmounts,
  matchProductDiscount,
} from "../utils/calculations";

function formatLineNumber(value: number) {
  if (!Number.isFinite(value)) return "";
  return String(value);
}

function LineNumberInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: number;
  onChange: (next: number) => void;
  ariaLabel: string;
}) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState(() => formatLineNumber(value));

  useEffect(() => {
    if (!focused) setRaw(formatLineNumber(value));
  }, [value, focused]);

  return (
    <input
      id={`line-num-${ariaLabel?.toLowerCase().replace(/[^a-z0-9]/g, "-") || "input"}`}
      name={`line_num_${ariaLabel?.toLowerCase().replace(/[^a-z0-9]/g, "_") || "input"}`}
      className="erp-input erp-line-num"
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      value={raw}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        setRaw(formatLineNumber(value));
      }}
      onChange={(event) => {
        const next = event.target.value.replace(/,/g, "");
        if (next !== "" && !/^\d*[.]?\d*$/.test(next)) return;
        setRaw(next);
        if (next === "" || next === ".") {
          onChange(0);
          return;
        }
        const parsed = Number(next);
        if (Number.isFinite(parsed)) onChange(parsed);
      }}
    />
  );
}

export function UabLineGrid({
  lines,
  onChange,
  items,
  priceField,
  schemes = [],
}: {
  lines: DocLine[];
  onChange: (next: DocLine[]) => void;
  items: MasterOption[];
  priceField?: "sellingPrice" | "purchasePrice";
  schemes?: DiscountScheme[];
}) {
  const field = priceField || "sellingPrice";
  const applySchemes = field === "sellingPrice" && schemes.length > 0;

  const schemePatch = (item: MasterOption | undefined, quantity: number): Partial<DocLine> => {
    if (!applySchemes) return { schemeId: "", schemeName: "", discountType: "", discountValue: 0 };
    const match = matchProductDiscount(item, quantity, schemes);
    return {
      schemeId: match?.schemeId || "",
      schemeName: match?.schemeName || "",
      discountType: match?.discountType || "",
      discountValue: match?.discountValue || 0,
    };
  };

  const update = (key: string, patch: Partial<DocLine>) => {
    onChange(lines.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  return (
    <div className="erp-line-grid space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Lines</p>
        <button
          type="button"
          className={`${erpButtonClassName.secondary} text-xs cursor-pointer`}
          onClick={() => onChange([...lines, emptyDocLine()])}
        >
          <Plus className="h-3.5 w-3.5" />
          Add line
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-left text-xs text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-2 py-2 min-w-[16rem]">Item</th>
              <th className="px-2 py-2 w-24">Qty</th>
              <th className="px-2 py-2 w-28">Rate</th>
              <th className="px-2 py-2 w-24">Discount</th>
              <th className="px-2 py-2 w-24">GST %</th>
              <th className="px-2 py-2 w-28 text-right">Amount</th>
              <th className="px-2 py-2 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {lines.map((line) => {
              const amounts = lineAmounts(line);
              return (
                <tr key={line.key} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-2 py-1.5 min-w-[16rem]">
                    <select
                      id={`line-item-select-${line.key}`}
                      name={`line_item_${line.key}`}
                      className="erp-select cursor-pointer"
                      value={line.itemId}
                      onChange={(event) => {
                        const item = items.find((row) => row.id === event.target.value);
                        update(line.key, {
                          itemId: event.target.value,
                          description: item?.label || "",
                          unitPrice: item?.[field] ?? line.unitPrice,
                          taxRate: item?.taxRate ?? line.taxRate,
                          ...schemePatch(item, line.quantity),
                        });
                      }}
                    >
                      <option value="">Select item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    {line.schemeName ? (
                      <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400">{line.schemeName}</p>
                    ) : null}
                  </td>
                  <td className="px-2 py-1.5 w-24">
                    <LineNumberInput
                      ariaLabel="Quantity"
                      value={line.quantity}
                      onChange={(quantity) => {
                        const item = items.find((row) => row.id === line.itemId);
                        update(line.key, { quantity, ...schemePatch(item, quantity) });
                      }}
                    />
                  </td>
                  <td className="px-2 py-1.5 w-28">
                    <LineNumberInput
                      ariaLabel="Rate"
                      value={line.unitPrice}
                      onChange={(unitPrice) => update(line.key, { unitPrice })}
                    />
                  </td>
                  <td className="px-2 py-1.5 w-24 text-xs text-slate-600 dark:text-slate-400">
                    {formatSchemeDiscount(line.discountType, line.discountValue)}
                  </td>
                  <td className="px-2 py-1.5 w-24">
                    <LineNumberInput
                      ariaLabel="GST percent"
                      value={line.taxRate}
                      onChange={(taxRate) => update(line.key, { taxRate })}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums font-medium text-slate-900 dark:text-slate-100">
                    {formatInr(amounts.total)}
                  </td>
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                      disabled={lines.length <= 1}
                      onClick={() => onChange(lines.filter((row) => row.key !== line.key))}
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const ErpLineGrid = UabLineGrid;
