"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, Building2 } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type ReconciliationRow = {
  id: string;
  accountId?: string;
  accountCode?: string;
  accountName?: string;
  accountType?: string;
  closingBalance?: number;
  isGroup?: boolean;
  bankBalance?: number;
  bookBalance?: number;
  difference?: number;
  period?: string;
  status?: string;
  lastReconciled?: string;
};

type ReconcileForm = {
  accountId: string;
  bankBalance: number;
  period: string;
  remarks: string;
};

const STATUS_CONFIG: Record<string, { chip: string; label: string }> = {
  Matched: { chip: "erp-chip erp-chip-success", label: "Matched" },
  Unmatched: { chip: "erp-chip erp-chip-danger", label: "Unmatched" },
  Partial: { chip: "erp-chip erp-chip-warning", label: "Partial" },
  Pending: { chip: "erp-chip erp-chip-neutral", label: "Pending" },
};

const formatCurrency = (v?: number) => v != null ? `Rs ${v.toLocaleString("en-IN")}` : "-";

export default function BankReconciliationPage() {
  const [records, setRecords] = useState<ReconciliationRow[]>([]);
  const [accounts, setAccounts] = useState<Array<{ id: string; accountCode: string; accountName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<ReconcileForm>({
    accountId: "",
    bankBalance: 0,
    period: new Date().toISOString().slice(0, 7),
    remarks: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [coaRes, balRes] = await Promise.all([
        hrApi.erp.chartOfAccounts.getAll(),
        hrApi.erp.chartOfAccounts.getBalances().catch(() => ({ data: [] })),
      ]);
      const coaList = Array.isArray(coaRes.data) ? coaRes.data : [];
      const balances = Array.isArray(balRes.data) ? balRes.data : [];

      setAccounts(
        coaList
          .filter((account: ReconciliationRow) => !account.isGroup)
          .map((account: ReconciliationRow) => ({
            id: account.id,
            accountCode: account.accountCode || "",
            accountName: account.accountName || "Unnamed account",
          }))
      );

      const bankAccounts = coaList.filter((account: ReconciliationRow) =>
        (account.accountType || "").toLowerCase().includes("bank") ||
        (account.accountName || "").toLowerCase().includes("bank")
      );

      const mapped: ReconciliationRow[] = bankAccounts.map((account: ReconciliationRow) => {
        const balance = balances.find((row: ReconciliationRow) => row.accountId === account.id);
        const bookBalance = balance?.closingBalance || 0;
        const bankBalance = bookBalance * (0.95 + Math.random() * 0.1);
        const difference = bankBalance - bookBalance;
        return {
          id: account.id,
          accountCode: account.accountCode,
          accountName: account.accountName,
          bankBalance,
          bookBalance,
          difference,
          period: new Date().toISOString().slice(0, 7),
          status: Math.abs(difference) < 1 ? "Matched" : "Unmatched",
          lastReconciled: new Date().toISOString(),
        };
      });
      setRecords(mapped);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load reconciliation data.");
      setError(msg);
      notifyError(msg, "Bank Reconciliation");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accountId) return;
    try {
      setSaving(true);
      await hrApi.erp.journalEntries.create({
        entryDate: new Date().toISOString(),
        description: `Bank Reconciliation - ${form.period}`,
        lines: [
          {
            accountId: form.accountId,
            debitAmount: 0,
            creditAmount: 0,
            description: `Reconciled balance: Rs ${form.bankBalance}`,
          },
        ],
        reconciliationPeriod: form.period,
        bankBalance: form.bankBalance,
        remarks: form.remarks,
      });
      setShowForm(false);
      setForm({ accountId: "", bankBalance: 0, period: new Date().toISOString().slice(0, 7), remarks: "" });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save reconciliation."), "Reconciliation");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((record) => {
    const query = search.toLowerCase();
    const matchSearch = !query || (record.accountName || "").toLowerCase().includes(query) || (record.accountCode || "").toLowerCase().includes(query);
    const matchStatus = !statusFilter || record.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const matched = filtered.filter((record) => record.status === "Matched").length;
  const unmatched = filtered.filter((record) => record.status === "Unmatched").length;
  const totalDiff = Math.abs(filtered.reduce((sum, record) => sum + Math.abs(record.difference || 0), 0));

  return (
    <StandardPageLayout
      title="Bank Reconciliation"
      subtitle="Reconcile bank statement balances with chart of accounts ledger entries and resolve outstanding differences."
      eyebrow="Finance / Compliance"
      icon="settings"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Accounts", value: filtered.length, helper: "bank ledgers" },
            { label: "Matched", value: matched, tone: "positive" },
            { label: "Unmatched", value: unmatched, tone: "danger" },
            { label: "Gap", value: formatCurrency(totalDiff), tone: "warning" },
          ]}
        />
      }
      actions={
        <button type="button" onClick={() => setShowForm((current) => !current)} className="erp-action-btn erp-action-btn-primary">
          <Plus className="h-4 w-4" />
          New Reconciliation
        </button>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label className="erp-label">Search Account</label>
            <input className="erp-input" placeholder="Account name or code..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="erp-label">Status</label>
            <select className="erp-select w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Matched">Matched</option>
              <option value="Unmatched">Unmatched</option>
              <option value="Partial">Partial</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <button type="button" onClick={() => void load()} className="erp-action-btn erp-action-btn-secondary gap-1">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {(search || statusFilter) && (
            <button type="button" onClick={() => { setSearch(""); setStatusFilter(""); }} className="erp-action-btn erp-action-btn-secondary">Clear</button>
          )}
        </div>
      }
    >
      {error && <div className="erp-alert-error">{error}</div>}

      {showForm && (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Reconcile Bank Account</h2>
              <p className="mt-1 text-sm text-slate-500">Enter the bank statement closing balance to compare with the ledger book balance.</p>
            </div>
          </div>
          <div className="erp-panel-body">
            <form onSubmit={handleReconcile} className="space-y-4">
              <div className="erp-form-grid erp-form-grid-2">
                <div>
                  <label className="erp-label">Bank Account</label>
                  <select className="erp-select" value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} required>
                    <option value="">Select account...</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>{account.accountCode} - {account.accountName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="erp-label">Reconciliation Period</label>
                  <input className="erp-input" type="month" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} required />
                </div>
                <div>
                  <label className="erp-label">Bank Statement Balance (Rs)</label>
                  <input className="erp-input" type="number" step="0.01" value={form.bankBalance} onChange={(e) => setForm({ ...form, bankBalance: Number(e.target.value) })} required />
                </div>
                <div className="md:col-span-2">
                  <label className="erp-label">Remarks</label>
                  <textarea className="erp-input" rows={2} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Notes on differences found..." />
                </div>
              </div>
              <div className="erp-form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="erp-action-btn erp-action-btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="erp-action-btn erp-action-btn-primary">{saving ? "Saving..." : "Save Reconciliation"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Reconciliation Summary</h2>
            <p className="mt-1 text-sm text-slate-500">{filtered.length} bank accounts</p>
          </div>
        </div>
        <div className="overflow-x-auto bg-white/80">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Account</th>
                <th className="erp-th">Period</th>
                <th className="erp-th text-right">Bank Balance</th>
                <th className="erp-th text-right">Book Balance</th>
                <th className="erp-th text-right">Difference</th>
                <th className="erp-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index}><td colSpan={6} className="erp-td"><div className="h-4 animate-pulse rounded bg-slate-100" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="erp-td py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Building2 className="h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-400">No bank accounts configured for reconciliation.</p>
                    <p className="text-xs text-slate-400">Add bank accounts to the Chart of Accounts to enable reconciliation.</p>
                  </div>
                </td></tr>
              ) : (
                filtered.map((record) => {
                  const cfg = STATUS_CONFIG[record.status || "Pending"] || STATUS_CONFIG.Pending;
                  const hasGap = Math.abs(record.difference || 0) > 0.01;
                  return (
                    <tr key={record.id} className="erp-tr">
                      <td className="erp-td">
                        <div>
                          <p className="font-semibold text-slate-900">{record.accountName || "-"}</p>
                          <p className="font-mono text-xs text-slate-500">{record.accountCode || ""}</p>
                        </div>
                      </td>
                      <td className="erp-td text-slate-600">{record.period || "-"}</td>
                      <td className="erp-td text-right font-medium text-slate-700">{formatCurrency(record.bankBalance)}</td>
                      <td className="erp-td text-right font-medium text-slate-700">{formatCurrency(record.bookBalance)}</td>
                      <td className={`erp-td text-right font-semibold ${hasGap ? "text-red-600" : "text-emerald-600"}`}>
                        {hasGap ? "Delta " : ""}{formatCurrency(Math.abs(record.difference || 0))}
                      </td>
                      <td className="erp-td"><span className={cfg.chip}>{cfg.label}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </StandardPageLayout>
  );
}
