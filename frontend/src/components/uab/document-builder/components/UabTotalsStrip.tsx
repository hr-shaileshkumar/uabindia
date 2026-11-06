"use client";

import {
  BILL_DISCOUNT_PERCENTS,
  type BillDiscount,
} from "../types";
import { formatInr, withBillDiscount } from "../utils/calculations";

export function UabTotalsStrip({
  subTotal,
  taxAmount,
  total,
  cgst,
  sgst,
  igst,
  discount,
  onDiscountChange,
}: {
  subTotal: number;
  taxAmount: number;
  total: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  discount: BillDiscount;
  onDiscountChange: (next: BillDiscount) => void;
}) {
  const billed = withBillDiscount({ subTotal, taxAmount, total }, discount);

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-sm">
      <div className="flex justify-between text-slate-700 dark:text-slate-300">
        <span className="text-slate-500 dark:text-slate-400">Taxable</span>
        <span className="tabular-nums">{formatInr(subTotal)}</span>
      </div>
      {igst ? (
        <div className="flex justify-between text-slate-700 dark:text-slate-300">
          <span className="text-slate-500 dark:text-slate-400">IGST</span>
          <span className="tabular-nums">{formatInr(igst)}</span>
        </div>
      ) : (
        <>
          <div className="flex justify-between text-slate-700 dark:text-slate-300">
            <span className="text-slate-500 dark:text-slate-400">CGST</span>
            <span className="tabular-nums">{formatInr(cgst ?? taxAmount / 2)}</span>
          </div>
          <div className="flex justify-between text-slate-700 dark:text-slate-300">
            <span className="text-slate-500 dark:text-slate-400">SGST</span>
            <span className="tabular-nums">{formatInr(sgst ?? taxAmount / 2)}</span>
          </div>
        </>
      )}
      <div className="mt-1 flex justify-between font-semibold text-slate-900 dark:text-slate-100">
        <span>Total</span>
        <span className="tabular-nums">{formatInr(total)}</span>
      </div>
      <div className="mt-2 space-y-2 border-t border-slate-200 dark:border-slate-700 pt-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 dark:text-slate-400">Discount</span>
          <select
            id="bill-discount-kind"
            name="bill_discount_kind"
            className="erp-select w-36 cursor-pointer"
            value={discount.kind}
            onChange={(event) => {
              const kind = event.target.value as BillDiscount["kind"];
              onDiscountChange({ ...discount, kind });
            }}
            aria-label="Discount type"
          >
            <option value="none">No discount</option>
            <option value="percent">Percent</option>
            <option value="amount">Amount</option>
          </select>
        </div>
        {discount.kind === "percent" ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 dark:text-slate-400">Discount %</span>
            <select
              id="bill-discount-percent"
              name="bill_discount_percent"
              className="erp-select w-36 cursor-pointer"
              value={String(discount.percent)}
              onChange={(event) => onDiscountChange({ ...discount, percent: Number(event.target.value) })}
              aria-label="Discount percent"
            >
              {BILL_DISCOUNT_PERCENTS.map((percent) => (
                <option key={percent} value={percent}>
                  {percent}%
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {discount.kind === "amount" ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 dark:text-slate-400">Discount Rs</span>
            <input
              id="bill-discount-amount"
              name="bill_discount_amount"
              className="erp-input w-36 text-right"
              inputMode="decimal"
              aria-label="Discount amount"
              value={discount.amount || ""}
              onChange={(event) => {
                const raw = event.target.value.replace(/,/g, "");
                if (raw !== "" && !/^\d*[.]?\d*$/.test(raw)) return;
                onDiscountChange({ ...discount, amount: raw === "" || raw === "." ? 0 : Number(raw) });
              }}
            />
          </div>
        ) : null}
        {billed.discountAmount > 0 ? (
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Less discount</span>
            <span className="tabular-nums">- {formatInr(billed.discountAmount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between font-semibold text-slate-900 dark:text-slate-100">
          <span>Net payable</span>
          <span className="tabular-nums">{formatInr(billed.netTotal)}</span>
        </div>
      </div>
    </div>
  );
}

export const ErpTotalsStrip = UabTotalsStrip;
