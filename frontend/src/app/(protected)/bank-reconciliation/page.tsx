"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpCreateButton, ErpDrawerFooter, ErpRefreshButton } from "@/components/erp/erp-page-kit";
import { financeApi } from "@/services/modules";
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
  bookBalance: number;
  period: string;
  remarks: string;
};

const STATUS_CONFIG: Record<string, { chip: string; label: string }> = {
  Matched: { chip: "erp-chip erp-chip-success", label: "Matched" },
  Unmatched: { chip: "erp-chip erp-chip-danger", label: "Unmatched" },
  Partial: { chip: "erp-chip erp-chip-warning", label: "Partial" },
  Pending: { chip: "erp-chip erp-chip-neutral", label: "Pending" },
};

const formatCurrency = (v?: number) => (v != null ? `Rs ${v.toLocaleString("en-IN")}` : "-");

function asArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: unknown[] }).data;
  }
  return [];
}

export default function BankReconciliationPage() {
  const [records, setRecords] = useState<ReconciliationRow[]>([]);
  const [accounts, setAccounts] = useState<Array<{ id: string; accountCode: string; accountName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [balanceByAccount, setBalanceByAccount] = useState<Record<string, number>>({});
  const [form, setForm] = useState<ReconcileForm>({
    accountId: "",
    bankBalance: 0,
    bookBalance: 0,
    period: new Date().toISOString().slice(0, 7),
    remarks: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [coaRes, balRes, reconRes] = await Promise.all([
        financeApi.chartOfAccounts.getAll(),
        financeApi.chartOfAccounts.getBalances().catch(() => ({ data: [] })),
        financeApi.bankReconciliations.getAll(1, 100),
      ]);
      const coaList = asArray(coaRes.data) as ReconciliationRow[];
      const balances = asArray(balRes.data) as Array<{ accountId?: string; closingBalance?: number }>;
      const reconList = asArray(reconRes.data) as Record<string, unknown>[];

      const balanceMap: Record<string, number> = {};
      for (const row of balances) {
        if (row.accountId) balanceMap[row.accountId] = Number(row.closingBalance ?? 0);
      }
      setBalanceByAccount(balanceMap);

      setAccounts(
        coaList
          .filter((account) => !account.isGroup)
          .map((account) => ({
            id: account.id!,
            accountCode: account.accountCode || "",
            accountName: account.accountName || "Unnamed account",
          })),
      );

      setRecords(
        reconList.map((row) => ({
          id: String(row.id),
          accountId: row.accountId ? String(row.accountId) : undefined,
          accountCode: String(row.accountCode ?? ""),
          accountName: String(row.accountName ?? ""),
          bankBalance: Number(row.bankBalance ?? 0),
          bookBalance: Number(row.bookBalance ?? 0),
          difference: Number(row.difference ?? 0),
          period: String(row.period ?? ""),
          status: String(row.status ?? "Pending"),
          lastReconciled: row.lastReconciled ? String(row.lastReconciled) : undefined,
        })),
      );
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

  const handleAccountChange = (accountId: string) => {
    setForm((current) => ({
      ...current,
      accountId,
      bookBalance: balanceByAccount[accountId] ?? 0,
    }));
  };

  const handleReconcile = async () => {
    if (!form.accountId) return;
    try {
      setSaving(true);
      const bookBalance = balanceByAccount[form.accountId] ?? form.bookBalance;
      await financeApi.bankReconciliations.create({
        accountId: form.accountId,
        bankBalance: form.bankBalance,
        bookBalance,
        period: form.period,
        remarks: form.remarks,
      });
      setShowForm(false);
      setForm({
        accountId: "",
        bankBalance: 0,
        bookBalance: 0,
        period: new Date().toISOString().slice(0, 7),
        remarks: "",
      });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save reconciliation."), "Reconciliation");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((record) => {
    const query = search.toLowerCase();
    const matchSearch =
      !query ||
      (record.accountName || "").toLowerCase().includes(query) ||
      (record.accountCode || "").toLowerCase().includes(query);
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
            { label: "Records", value: filtered.length, helper: "reconciliations" },
            { label: "Matched", value: matched, tone: "positive" },
            { label: "Unmatched", value: unmatched, tone: "danger" },
            { label: "Gap", value: formatCurrency(totalDiff), tone: "warning" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          <ErpCreateButton label="New reconciliation" onClick={() => setShowForm(true)} />
        </>
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
          {(search || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
              }}
              className="erp-action-btn erp-action-btn-secondary"
            >
              Clear
            </button>
          )}
        </div>
      }
    >
      {error && <div className="erp-alert-error">{error}</div>}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Reconciliation Summary</h2>
            <p className="mt-1 text-sm text-slate-500">{filtered.length} reconciliation records</p>
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
                  <tr key={index}>
                    <td colSpan={6} className="erp-td">
                      <div className="h-4 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="erp-td py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Building2 className="h-10 w-10 text-slate-300" />
                      <p className="text-sm text-slate-400">No reconciliations yet.</p>
                      <p className="text-xs text-slate-400">Create a reconciliation against a chart of accounts bank ledger.</p>
                    </div>
                  </td>
                </tr>
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
                        {hasGap ? "Delta " : ""}
                        {formatCurrency(Math.abs(record.difference || 0))}
                      </td>
                      <td className="erp-td">
                        <span className={cfg.chip}>{cfg.label}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SideDrawer
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New reconciliation"
        subtitle="Enter the bank statement closing balance to compare with the ledger."
        width="md"
        footer={
          <ErpDrawerFooter
            onCancel={() => setShowForm(false)}
            onSave={() => void handleReconcile()}
            saving={saving}
            saveLabel="Save reconciliation"
          />
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="erp-label">Bank Account</label>
            <select className="erp-select mt-1" value={form.accountId} onChange={(e) => handleAccountChange(e.target.value)}>
              <option value="">Select account...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.accountCode} - {account.accountName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="erp-label">Reconciliation Period</label>
            <input className="erp-input mt-1" type="month" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
          </div>
          <div>
            <label className="erp-label">Bank Statement Balance (Rs)</label>
            <input
              className="erp-input mt-1"
              type="number"
              step="0.01"
              value={form.bankBalance}
              onChange={(e) => setForm({ ...form, bankBalance: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="erp-label">Book Balance (Rs)</label>
            <input className="erp-input mt-1" type="number" step="0.01" value={form.bookBalance} readOnly />
          </div>
          <div>
            <label className="erp-label">Remarks</label>
            <textarea
              className="erp-input mt-1"
              rows={2}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Notes on differences found..."
            />
          </div>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}
