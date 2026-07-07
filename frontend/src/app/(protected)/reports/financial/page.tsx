"use client";

import { useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";

const formatCurrency = (v?: number) => v != null ? `₹${v.toLocaleString("en-IN")}` : "—";

export default function FinancialReportsPage() {
  const [accounts, setAccounts] = useState<{ id: string; name?: string; accountType?: string; balance?: number }[]>([]);
  const [journalEntries, setJournalEntries] = useState<{ id: string; description?: string; totalDebit?: number; totalCredit?: number; status?: string; entryDate?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"balances" | "journals">("balances");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [acctRes, journalRes] = await Promise.all([
          hrApi.erp.chartOfAccounts.getBalances(),
          hrApi.erp.journalEntries.list(1, 20, "Posted"),
        ]);
        setAccounts(Array.isArray(acctRes.data) ? acctRes.data : []);
        const jRaw = journalRes.data;
        setJournalEntries(Array.isArray(jRaw) ? jRaw : Array.isArray(jRaw?.data) ? jRaw.data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load financial reports");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const totalAssets = accounts.filter((a) => (a.accountType || "").toLowerCase().includes("asset")).reduce((s, a) => s + (a.balance || 0), 0);
  const totalLiabilities = accounts.filter((a) => (a.accountType || "").toLowerCase().includes("liabilit")).reduce((s, a) => s + (a.balance || 0), 0);
  const totalJournalValue = journalEntries.reduce((s, j) => s + (j.totalDebit || 0), 0);

  return (
    <StandardPageLayout
      title="Financial Reports"
      subtitle="Account balances, journal entry summaries, and period financial snapshots."
      eyebrow="Reports / Finance"
      icon="bar-chart"
    >
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Chart Accounts</p>
          <p className="erp-kpi-value">{accounts.length}</p>
          <p className="erp-kpi-meta">Active accounts in COA</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Total Assets</p>
          <p className="erp-kpi-value erp-kpi-value-success">{formatCurrency(totalAssets)}</p>
          <p className="erp-kpi-meta">Asset account balances</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-danger">
          <p className="erp-kpi-label">Total Liabilities</p>
          <p className="erp-kpi-value">{formatCurrency(totalLiabilities)}</p>
          <p className="erp-kpi-meta">Liability account balances</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Journal Debit Total</p>
          <p className="erp-kpi-value">{formatCurrency(totalJournalValue)}</p>
          <p className="erp-kpi-meta">Posted entries this page</p>
        </div>
      </div>

      {error && <div className="erp-alert-error">{error}</div>}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div className="erp-tabs-list">
            <button type="button" onClick={() => setActiveTab("balances")} className={activeTab === "balances" ? "erp-tab-trigger erp-tab-trigger-active" : "erp-tab-trigger"}>Account Balances</button>
            <button type="button" onClick={() => setActiveTab("journals")} className={activeTab === "journals" ? "erp-tab-trigger erp-tab-trigger-active" : "erp-tab-trigger"}>Journal Entries</button>
          </div>
        </div>
        <div className="erp-panel-body">
          {loading ? (
            <div className="erp-loading">Loading financial data…</div>
          ) : (
            <>
              {activeTab === "balances" && (
                <div className="overflow-x-auto bg-white/80">
                  <table className="erp-table">
                    <thead className="erp-thead">
                      <tr>
                        <th className="erp-th">Account Name</th>
                        <th className="erp-th">Type</th>
                        <th className="erp-th text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.length === 0 ? (
                        <tr><td colSpan={3} className="erp-td py-10 text-center text-slate-400">No account balances found.</td></tr>
                      ) : (
                        accounts.map((a) => (
                          <tr key={a.id} className="erp-tr">
                            <td className="erp-td font-medium text-slate-900">{a.name || "—"}</td>
                            <td className="erp-td"><span className="erp-chip erp-chip-neutral">{a.accountType || "—"}</span></td>
                            <td className="erp-td text-right font-semibold text-slate-900">{formatCurrency(a.balance)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === "journals" && (
                <div className="overflow-x-auto bg-white/80">
                  <table className="erp-table">
                    <thead className="erp-thead">
                      <tr>
                        <th className="erp-th">Date</th>
                        <th className="erp-th">Description</th>
                        <th className="erp-th">Debit</th>
                        <th className="erp-th">Credit</th>
                        <th className="erp-th">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {journalEntries.length === 0 ? (
                        <tr><td colSpan={5} className="erp-td py-10 text-center text-slate-400">No posted journal entries.</td></tr>
                      ) : (
                        journalEntries.map((j) => (
                          <tr key={j.id} className="erp-tr">
                            <td className="erp-td text-slate-600">{j.entryDate ? new Date(j.entryDate).toLocaleDateString("en-IN") : "—"}</td>
                            <td className="erp-td text-slate-700">{j.description || "—"}</td>
                            <td className="erp-td font-medium text-slate-900">{formatCurrency(j.totalDebit)}</td>
                            <td className="erp-td font-medium text-slate-900">{formatCurrency(j.totalCredit)}</td>
                            <td className="erp-td"><span className="erp-chip erp-chip-success">{j.status || "Posted"}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </StandardPageLayout>
  );
}
