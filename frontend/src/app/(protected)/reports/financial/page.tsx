"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import HeaderSummary from "@/components/layout/HeaderSummary";
import { CrudCard } from "@/components/workspace/crud-workspace";
import { ErpRefreshButton, ErpTabBar, ErpTabPanel } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { financeApi, reportsApi } from "@/services/modules";

const formatCurrency = (v?: number) => (v != null ? `Rs${v.toLocaleString("en-IN")}` : "-");

type TabKey = "balances" | "journals" | "statements";

export default function FinancialReportsPage() {
  const [accounts, setAccounts] = useState<
    { id: string; name?: string; accountType?: string; balance?: number }[]
  >([]);
  const [journalEntries, setJournalEntries] = useState<
    { id: string; description?: string; totalDebit?: number; totalCredit?: number; status?: string; entryDate?: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("balances");
  const [trial, setTrial] = useState<{
    totalDebit?: number;
    totalCredit?: number;
    rows?: { accountName?: string; accountType?: string; debit?: number; credit?: number }[];
  }>({});
  const [pnl, setPnl] = useState<{ revenue?: number; expense?: number; netProfit?: number }>({});
  const [bs, setBs] = useState<{ assets?: number; liabilities?: number; equity?: number; balanced?: boolean }>({});
  const [ageing, setAgeing] = useState<{
    receivables?: { current?: number; days31to60?: number; days61to90?: number; over90?: number; total?: number };
    payables?: { current?: number; days31to60?: number; days61to90?: number; over90?: number; total?: number };
  }>({});
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
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
      setJournalEntries(
        Array.isArray(journalRaw) ? journalRaw : Array.isArray(journalRaw?.data) ? journalRaw.data : [],
      );
      setTrial((tb.data ?? {}) as typeof trial);
      setPnl((pl.data ?? {}) as typeof pnl);
      setBs((sheet.data ?? {}) as typeof bs);
      setAgeing((age.data ?? {}) as typeof ageing);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load financial reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalAssets = useMemo(
    () =>
      accounts
        .filter((account) => (account.accountType || "").toLowerCase().includes("asset"))
        .reduce((sum, account) => sum + (account.balance || 0), 0),
    [accounts],
  );
  const totalLiabilities = useMemo(
    () =>
      accounts
        .filter((account) => (account.accountType || "").toLowerCase().includes("liabilit"))
        .reduce((sum, account) => sum + (account.balance || 0), 0),
    [accounts],
  );
  const totalJournalValue = useMemo(
    () => journalEntries.reduce((sum, entry) => sum + (entry.totalDebit || 0), 0),
    [journalEntries],
  );

  const balancesList = useErpListView({
    listKey: "reports-financial-balances",
    rows: accounts,
    loading: loading && activeTab === "balances",
    emptyMessage: "No account balances found.",
    getRowId: (row) => row.id,
    onRefresh: () => void load(),
    columns: [
      { key: "name", label: "Account Name", dataType: "string" },
      { key: "accountType", label: "Type", dataType: "string" },
      { key: "balance", label: "Balance", dataType: "number" },
    ],
    renderRow: (account) => (
      <>
        <td className="erp-td font-medium text-slate-900">{account.name || "-"}</td>
        <td className="erp-td">
          <span className="erp-chip erp-chip-neutral">{account.accountType || "-"}</span>
        </td>
        <td className="erp-td text-right font-semibold text-slate-900">{formatCurrency(account.balance)}</td>
      </>
    ),
  });

  const journalsList = useErpListView({
    listKey: "reports-financial-journals",
    rows: journalEntries,
    loading: loading && activeTab === "journals",
    emptyMessage: "No posted journal entries.",
    getRowId: (row) => row.id,
    onRefresh: () => void load(),
    columns: [
      { key: "entryDate", label: "Date", dataType: "string" },
      { key: "description", label: "Description", dataType: "string" },
      { key: "totalDebit", label: "Debit", dataType: "number" },
      { key: "totalCredit", label: "Credit", dataType: "number" },
      { key: "status", label: "Status", dataType: "string" },
    ],
    renderRow: (entry) => (
      <>
        <td className="erp-td text-slate-600">
          {entry.entryDate ? new Date(entry.entryDate).toLocaleDateString("en-IN") : "-"}
        </td>
        <td className="erp-td text-slate-700">{entry.description || "-"}</td>
        <td className="erp-td font-medium text-slate-900">{formatCurrency(entry.totalDebit)}</td>
        <td className="erp-td font-medium text-slate-900">{formatCurrency(entry.totalCredit)}</td>
        <td className="erp-td">
          <span className="erp-chip erp-chip-success">{entry.status || "Posted"}</span>
        </td>
      </>
    ),
  });

  const tabItems = [
    { key: "balances", label: "Account Balances", count: accounts.length },
    { key: "journals", label: "Journal Entries", count: journalEntries.length },
    { key: "statements", label: "TB / P&L / BS" },
  ];

  const activeListTools =
    activeTab === "balances" ? balancesList.headerTools : activeTab === "journals" ? journalsList.headerTools : null;

  const activeFilterBar =
    activeTab === "balances" ? balancesList.filterBar : activeTab === "journals" ? journalsList.filterBar : undefined;

  return (
    <StandardPageLayout
      title="Financial Reports"
      subtitle="Account balances, journal entry summaries, and period financial snapshots."
      eyebrow="Reports / Finance"
      icon="bar-chart"
      meta={
        <HeaderSummary
          items={[
            { label: "Accounts", value: accounts.length, tone: "info" },
            { label: "Assets", value: formatCurrency(totalAssets), tone: "success" },
            { label: "Liabilities", value: formatCurrency(totalLiabilities), tone: "danger" },
            { label: "Journal Debit", value: formatCurrency(totalJournalValue), tone: "info" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          {activeListTools}
        </>
      }
      filters={activeFilterBar}
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <ErpTabBar tabs={tabItems} active={activeTab} onChange={(key) => setActiveTab(key as TabKey)} />

      <ErpTabPanel hidden={activeTab !== "balances"}>
        <CrudCard>{balancesList.table}</CrudCard>
      </ErpTabPanel>

      <ErpTabPanel hidden={activeTab !== "journals"}>
        <CrudCard>{journalsList.table}</CrudCard>
      </ErpTabPanel>

      <ErpTabPanel hidden={activeTab !== "statements"}>
        <CrudCard>
          {loading ? (
            <p className="p-4 text-sm text-slate-500">Loading financial data...</p>
          ) : (
            <div className="grid gap-4 p-4 md:grid-cols-3 text-sm">
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
                  <input
                    className="erp-input w-28"
                    type="number"
                    value={periodYear}
                    onChange={(e) => setPeriodYear(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="erp-label">Month</label>
                  <input
                    className="erp-input w-20"
                    type="number"
                    min={1}
                    max={12}
                    value={periodMonth}
                    onChange={(e) => setPeriodMonth(Number(e.target.value))}
                  />
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
        </CrudCard>
      </ErpTabPanel>
    </StandardPageLayout>
  );
}
