"use client";

import { formatCurrency } from "@/lib/formatters";
import type { BankAccountOption } from "../types/reconciliation.types";

interface TreasuryLedgersTableProps {
  accounts: BankAccountOption[];
  onReconcileAccount: (accountId: string) => void;
}

export function TreasuryLedgersTable({
  accounts,
  onReconcileAccount,
}: TreasuryLedgersTableProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="text-xs text-slate-600 dark:text-slate-400">
          Direct Chart of Accounts treasury accounts register. Reconcile any bank or cash ledger with one click.
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Total Treasury Accounts: <strong>{accounts.length}</strong>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4">Account Code</th>
                <th className="py-3 px-4">Account Name</th>
                <th className="py-3 px-4">Ledger Type</th>
                <th className="py-3 px-4 text-right">Current Ledger Balance</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {accounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {acc.accountCode}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                    {acc.accountName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {acc.accountType || "Asset"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(acc.currentBalance ?? 0, "INR")}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onReconcileAccount(acc.id)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-semibold text-xs transition cursor-pointer"
                    >
                      Reconcile Account
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
