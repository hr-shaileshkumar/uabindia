"use client";

import { Info } from "lucide-react";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpDrawerFooter } from "@/components/workspace/page-kit";
import { formatCurrency } from "@/lib/formatters";
import type {
  BankAccountOption,
  DrawerTab,
  ReconciliationForm,
} from "../types/reconciliation.types";

interface ReconciliationFormDrawerProps {
  open: boolean;
  onClose: () => void;
  editingId: string | null;
  form: ReconciliationForm;
  onFormChange: React.Dispatch<React.SetStateAction<ReconciliationForm>>;
  accounts: BankAccountOption[];
  onAccountSelect: (accountId: string) => void;
  drawerTab: DrawerTab;
  onDrawerTabChange: (tab: DrawerTab) => void;
  liveFormDifference: number;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function ReconciliationFormDrawer({
  open,
  onClose,
  editingId,
  form,
  onFormChange,
  accounts,
  onAccountSelect,
  drawerTab,
  onDrawerTabChange,
  liveFormDifference,
  onSave,
  saving,
}: ReconciliationFormDrawerProps) {
  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title={editingId ? "Edit Bank Reconciliation" : "New Bank Reconciliation"}
      subtitle="Compare the bank statement closing balance with the general ledger book balance to record variances."
      width="lg"
      footer={
        <ErpDrawerFooter
          onCancel={onClose}
          onSave={onSave}
          saving={saving}
          saveLabel={editingId ? "Update Reconciliation" : "Save Reconciliation"}
        />
      }
    >
      <div className="space-y-6">
        {/* Drawer Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onDrawerTabChange("account")}
            className={`py-2 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
              drawerTab === "account"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            1. Account & Period
          </button>
          <button
            type="button"
            onClick={() => onDrawerTabChange("balances")}
            className={`py-2 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
              drawerTab === "balances"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            2. Balances & Variance
          </button>
          <button
            type="button"
            onClick={() => onDrawerTabChange("adjustments")}
            className={`py-2 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
              drawerTab === "adjustments"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            3. Status & Memo
          </button>
        </div>

        {/* TAB 1: ACCOUNT & PERIOD */}
        {drawerTab === "account" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Treasury Bank Account *
              </label>
              <select
                value={form.accountId}
                onChange={(e) => onAccountSelect(e.target.value)}
                className="w-full py-2.5 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
              >
                <option value="">Select bank or cash ledger...</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountCode} — {acc.accountName} (Balance: {formatCurrency(acc.currentBalance ?? 0, "INR")})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 block mt-1">
                Select the Chart of Accounts ledger corresponding to the statement.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Fiscal Period (Month) *
              </label>
              <input
                type="month"
                value={form.period}
                onChange={(e) => onFormChange((prev) => ({ ...prev, period: e.target.value }))}
                className="w-full py-2 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                Bank reconciliations verify that every debit and credit listed on the bank statement matches an
                approved ledger journal entry. Any difference reflects deposits in transit, unpresented checks, or
                bank fees.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BALANCES & VARIANCE */}
        {drawerTab === "balances" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Bank Statement Closing Balance (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.bankBalance}
                  onChange={(e) => onFormChange((prev) => ({ ...prev, bankBalance: e.target.value }))}
                  className="w-full py-2 px-3 font-mono text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Ending balance reported on the physical or electronic bank statement.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  GL Book Balance (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.bookBalance}
                  onChange={(e) => onFormChange((prev) => ({ ...prev, bookBalance: e.target.value }))}
                  className="w-full py-2 px-3 font-mono text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Current balance from the General Ledger Chart of Accounts.
                </span>
              </div>
            </div>

            {/* Live Calculated Variance Card */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                Math.abs(liveFormDifference) < 0.01
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60"
                  : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                    Calculated Difference (Bank - Book)
                  </span>
                  <div
                    className={`text-xl font-mono font-bold ${
                      Math.abs(liveFormDifference) < 0.01
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {formatCurrency(liveFormDifference, "INR")}
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    Math.abs(liveFormDifference) < 0.01
                      ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                      : "bg-amber-200 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
                  }`}
                >
                  {Math.abs(liveFormDifference) < 0.01 ? "Zero Variance - In Balance" : "Variance Detected"}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                {Math.abs(liveFormDifference) < 0.01
                  ? "Bank statement closing balance matches general ledger book balance exactly."
                  : liveFormDifference > 0
                  ? `Bank balance exceeds book balance by ${formatCurrency(
                      liveFormDifference,
                      "INR"
                    )}. Possible unrecorded receipts, interest credit, or bank adjustments.`
                  : `Book balance exceeds bank balance by ${formatCurrency(
                      Math.abs(liveFormDifference),
                      "INR"
                    )}. Possible outstanding checks or uncredited deposit remittances.`}
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: ADJUSTMENTS & AUDIT MEMO */}
        {drawerTab === "adjustments" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Reconciliation Status
              </label>
              <select
                value={form.status || "Auto"}
                onChange={(e) => onFormChange((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full py-2 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition cursor-pointer"
              >
                <option value="Auto">Auto-Compute from Variance</option>
                <option value="Matched">Zero-Delta Matched</option>
                <option value="Partial">Partial Match</option>
                <option value="Unmatched">Unmatched Discrepancy</option>
                <option value="Pending">Pending Review</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Audit Memo & Outstanding Notes
              </label>
              <textarea
                rows={4}
                value={form.remarks}
                onChange={(e) => onFormChange((prev) => ({ ...prev, remarks: e.target.value }))}
                placeholder="Record reconciliation notes, list outstanding checks or unexplained variances..."
                className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>
        )}
      </div>
    </SideDrawer>
  );
}
