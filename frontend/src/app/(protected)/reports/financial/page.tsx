"use client";

import { useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";
import { financeApi, reportsApi } from "@/services/modules";
const formatCurrency = (v?: number) => (v != null ? `Rs${v.toLocaleString("en-IN")}` : "-");

export default function FinancialReportsPage() {
  const [accounts, setAccounts] = useState<{ id: string; name?: string; accountType?: string; balance?: number }[]>([]);
  const [journalEntries, setJournalEntries] = useState<{ id: string; description?: string; totalDebit?: number; totalCredit?: number; status?: string; entryDate?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"balances" | "journals" | "statements">("balances");
  const [trial, setTrial] = useState<{ totalDebit?: number; totalCredit?: number; rows?: { accountName?: string; accountType?: string; debit?: number; credit?: number }[] }>({});
  const [pnl, setPnl] = useState<{ revenue?: number; expense?: number; netProfit?: number }>({});
  const [bs, setBs] = useState<{ assets?: number; liabilities?: number; equity?: number; balanced?: boolean }>({});
  const [ageing, setAgeing] = useState<{ receivables?: { current?: number; days31to60?: number; days61to90?: number; over90?: number; total?: number }; payables?: { current?: number; days31to60?: number; days61to90?: number; over90?: number; total?: number } }>({});
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [acctRes, journalRes, tb, pl, sheet, age] = await Promise.all([
          financeApi.chartOfAccounts.getBalances(),
          financeApi.journalEntries.list(1, 20, "Posted"),
          reportsApi.finance.trialBalance(),
          reportsApi.finance.profitAndLoss(),
          reportsApi.finance.balanceSheet(),
          reportsApi.finance.ageing(),
        ]);
        setAccounts(Array.isArray(acctRes.data) ? acctRes.data : []);
        const journalRaw = journalRes.data;
        setJournalEntries(Array.isArray(journalRaw) ? journalRaw : Array.isArray(journalRaw?.data) ? journalRaw.data : []);
        setTrial((tb.data ?? {}) as typeof trial);
        setPnl((pl.data ?? {}) as typeof pnl);
        setBs((sheet.data ?? {}) as typeof bs);
        setAgeing((age.data ?? {}) as typeof ageing);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load financial reports");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const totalAssets = accounts.filter((account) => (account.accountType || "").toLowerCase().includes("asset")).reduce((sum, account) => sum + (account.balance || 0), 0);
  const totalLiabilities = accounts.filter((account) => (account.accountType || "").toLowerCase().includes("liabilit")).reduce((sum, account) => sum + (account.balance || 0), 0);
  const totalJournalValue = journalEntries.reduce((sum, entry) => sum + (entry.totalDebit || 0), 0);

  return (
    <StandardPageLayout
      title="Financial Reports"
      subtitle="Account balances, journal entry summaries, and period financial snapshots."
      eyebrow="Reports / Finance"
      icon="bar-chart"
      meta={
        <ErpHeaderSummary
          items={[
            { label: "Accounts", value: accounts.length, tone: "info" },
            { label: "Assets", value: formatCurrency(totalAssets), tone: "success" },
            { label: "Liabilities", value: formatCurrency(totalLiabilities), tone: "danger" },
            { label: "Journal Debit", value: formatCurrency(totalJournalValue), tone: "info" },
          ]}
        />
      }
    >
      {error && <div className="erp-alert-error">{error}</div>}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div className="erp-tabs-list">
            <button type="button" onClick={() => setActiveTab("balances")} className={activeTab === "balances" ? "erp-tab-trigger erp-tab-trigger-active" : "erp-tab-trigger"}>Account Balances</button>
            <button type="button" onClick={() => setActiveTab("journals")} className={activeTab === "journals" ? "erp-tab-trigger erp-tab-trigger-active" : "erp-tab-trigger"}>Journal Entries</button>
            <button type="button" onClick={() => setActiveTab("statements")} className={activeTab === "statements" ? "erp-tab-trigger erp-tab-trigger-active" : "erp-tab-trigger"}>TB / P&L / BS</button>
          </div>
        </div>
        <div className="erp-panel-body">
          {loading ? (
            <div className="erp-loading">Loading financial data...</div>
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
                        accounts.map((account) => (
                          <tr key={account.id} className="erp-tr">
                            <td className="erp-td font-medium text-slate-900">{account.name || "-"}</td>
                            <td className="erp-td"><span className="erp-chip erp-chip-neutral">{account.accountType || "-"}</span></td>
                            <td className="erp-td text-right font-semibold text-slate-900">{formatCurrency(account.balance)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === "statements" && (
                <div className="grid gap-4 md:grid-cols-3 text-sm">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold">Trial balance</h3>
                    <p>Debit {formatCurrency(trial.totalDebit)}</p>
                    <p>Credit {formatCurrency(trial.totalCredit)}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold">Profit &amp; loss</h3>
                    <p>Revenue {formatCurrency(pnl.revenue)}</p>
                    <p>Expense {formatCurrency(pnl.expense)}</p>
                    <p>Net {formatCurrency(pnl.netProfit)}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold">Balance sheet</h3>
                    <p>Assets {formatCurrency(bs.assets)}</p>
                    <p>Liabilities {formatCurrency(bs.liabilities)}</p>
                    <p>Equity {formatCurrency(bs.equity)}</p>
                    <p>{bs.balanced ? "In balance" : "Out of balance"}</p>
                  </div>
                  <div className="rounded-lg border p-4 md:col-span-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <h3 className="font-semibold">Receivables ageing</h3>
                      <p>0-30 {formatCurrency(ageing.receivables?.current)}</p>
                      <p>31-60 {formatCurrency(ageing.receivables?.days31to60)}</p>
                      <p>61-90 {formatCurrency(ageing.receivables?.days61to90)}</p>
                      <p>90+ {formatCurrency(ageing.receivables?.over90)}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">Payables ageing</h3>
                      <p>0-30 {formatCurrency(ageing.payables?.current)}</p>
                      <p>31-60 {formatCurrency(ageing.payables?.days31to60)}</p>
                      <p>61-90 {formatCurrency(ageing.payables?.days61to90)}</p>
                      <p>90+ {formatCurrency(ageing.payables?.over90)}</p>
                    </div>
                  </div>
                  <div className="rounded-lg border p-4 md:col-span-3 flex flex-wrap items-end gap-3">
                    <div>
                      <label className="erp-label">Period year</label>
                      <input className="erp-input w-28" type="number" value={periodYear} onChange={(e) => setPeriodYear(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="erp-label">Month</label>
                      <input className="erp-input w-20" type="number" min={1} max={12} value={periodMonth} onChange={(e) => setPeriodMonth(Number(e.target.value))} />
                    </div>
                    <button
                      type="button"
                      className="erp-action-btn erp-action-btn-primary"
                      onClick={async () => {
                        try {
                          await financeApi.periods.close({ year: periodYear, month: periodMonth });
                          setError(null);
                        } catch (err: unknown) {
                          setError(err instanceof Error ? err.message : "Could not close period");
                        }
                      }}
                    >
                      Close period
                    </button>
                    <button
                      type="button"
                      className="erp-action-btn erp-action-btn-secondary"
                      onClick={async () => {
                        try {
                          await financeApi.periods.reopen({ year: periodYear, month: periodMonth });
                          setError(null);
                        } catch (err: unknown) {
                          setError(err instanceof Error ? err.message : "Could not reopen period");
                        }
                      }}
                    >
                      Reopen period
                    </button>
                  </div>
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
                        journalEntries.map((entry) => (
                          <tr key={entry.id} className="erp-tr">
                            <td className="erp-td text-slate-600">{entry.entryDate ? new Date(entry.entryDate).toLocaleDateString("en-IN") : "-"}</td>
                            <td className="erp-td text-slate-700">{entry.description || "-"}</td>
                            <td className="erp-td font-medium text-slate-900">{formatCurrency(entry.totalDebit)}</td>
                            <td className="erp-td font-medium text-slate-900">{formatCurrency(entry.totalCredit)}</td>
                            <td className="erp-td"><span className="erp-chip erp-chip-success">{entry.status || "Posted"}</span></td>
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
