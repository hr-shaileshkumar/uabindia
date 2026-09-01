"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";

const formatCurrency = (val: number) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

type JournalBalanceProps = {
  totalDebit: number;
  totalCredit: number;
};

export function JournalBalanceIndicator({
  totalDebit,
  totalCredit,
}: JournalBalanceProps) {
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01 && totalDebit > 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 shadow-2xs">
      <div className="flex items-center gap-6">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Debit</span>
          <p className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(totalDebit)}</p>
        </div>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Credit</span>
          <p className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(totalCredit)}</p>
        </div>
      </div>

      <div>
        {isBalanced ? (
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Balanced &middot; Ready to Post
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200/80 px-3 py-1.5 text-xs font-semibold text-rose-700">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            Imbalance: {formatCurrency(difference)}
          </div>
        )}
      </div>
    </div>
  );
}
