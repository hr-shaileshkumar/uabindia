"use client";

import { useCallback, useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpCreateButton, ErpDrawerFooter, ErpRefreshButton } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { financeApi } from "@/services/modules";
import apiClient from "@/services/apiClient";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { UploadCloud, Sparkles } from "lucide-react";

export type ReconciliationRow = {
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

export type ReconcileForm = {
  accountId: string;
  bankBalance: number;
  bookBalance: number;
  period: string;
  remarks: string;
};

export interface ParsedBankTransaction {
  transactionDate: string;
  amount: number;
  transactionType: "Credit" | "Debit";
  referenceNumber: string;
  description: string;
  payeePayer?: string;
}

export interface ParsedBankStatement {
  accountNumber: string;
  currency: string;
  openingBalance: number;
  closingBalance: number;
  statementDate: string;
  transactions: ParsedBankTransaction[];
}

const STATUS_CONFIG: Record<string, { chip: string; label: string }> = {
  Matched: { chip: "erp-chip erp-chip-success", label: "Matched" },
  Unmatched: { chip: "erp-chip erp-chip-danger", label: "Unmatched" },
  Partial: { chip: "erp-chip erp-chip-warning", label: "Partial" },
  Pending: { chip: "erp-chip erp-chip-neutral", label: "Pending" },
};

function asArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: unknown[] }).data;
  }
  return [];
}

export function BankReconciliationManager() {
  const [records, setRecords] = useState<ReconciliationRow[]>([]);
  const [accounts, setAccounts] = useState<Array<{ id: string; accountCode: string; accountName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showFeedDrawer, setShowFeedDrawer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [balanceByAccount, setBalanceByAccount] = useState<Record<string, number>>({});

  // Feed Import State
  const [feedFormat, setFeedFormat] = useState<"ofx" | "mt940" | "csv">("ofx");
  const [feedCurrency, setFeedCurrency] = useState("USD");
  const [feedContent, setFeedContent] = useState("");
  const [isParsingFeed, setIsParsingFeed] = useState(false);
  const [parsedStatement, setParsedStatement] = useState<ParsedBankStatement | null>(null);

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

  const handleParseBankFeed = async () => {
    if (!feedContent.trim()) {
      notifyError("Please paste or upload bank statement content.", "Bank Feed Parser");
      return;
    }

    setIsParsingFeed(true);
    try {
      const endpoint =
        feedFormat === "ofx"
          ? "/finance/bank-feed/parse-ofx"
          : feedFormat === "mt940"
            ? "/finance/bank-feed/parse-mt940"
            : "/finance/bank-feed/parse-csv";

      const res = await apiClient.post<{ success: boolean; data: ParsedBankStatement }>(endpoint, {
        fileContent: feedContent,
        currency: feedCurrency,
      });

      if (res.data?.data) {
        setParsedStatement(res.data.data);
        notifySuccess(`Successfully parsed ${res.data.data.transactions?.length || 0} transactions from bank feed.`);
      }
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to parse bank feed statement."), "Bank Feed Ingestion");
    } finally {
      setIsParsingFeed(false);
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

  const list = useErpListView({
    listKey: "bank-reconciliations",
    rows: filtered,
    columns: [
      { key: "accountName", label: "Account" },
      { key: "period", label: "Period" },
      { key: "bankBalance", label: "Bank Balance", className: "text-right", dataType: "currency" },
      { key: "bookBalance", label: "Book Balance", className: "text-right", dataType: "currency" },
      { key: "difference", label: "Difference", className: "text-right", dataType: "currency" },
      { key: "status", label: "Status" },
    ],
    getRowId: (row) => row.id,
    loading,
    emptyMessage: "No reconciliations yet. Create one or import a bank statement feed to compare balances.",
    onCreate: () => setShowForm(true),
    createLabel: "New reconciliation",
    onRefresh: () => void load(),
    extraFilters: (
      <>
        <input
          className="erp-input max-w-xs"
          placeholder="Account name or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="erp-select w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All status</option>
          <option value="Matched">Matched</option>
          <option value="Unmatched">Unmatched</option>
          <option value="Partial">Partial</option>
          <option value="Pending">Pending</option>
        </select>
        {search || statusFilter ? (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("");
            }}
            className="erp-action-btn erp-action-btn-secondary cursor-pointer"
          >
            Clear
          </button>
        ) : null}
      </>
    ),
    renderRow: (record) => {
      const cfg = STATUS_CONFIG[record.status || "Pending"] || STATUS_CONFIG.Pending;
      const hasGap = Math.abs(record.difference || 0) > 0.01;
      return (
        <tr key={record.id} className="erp-tr">
          <td className="erp-td">
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{record.accountName || "-"}</p>
              <p className="font-mono text-xs text-slate-500">{record.accountCode || ""}</p>
            </div>
          </td>
          <td className="erp-td text-slate-600 dark:text-slate-400">{record.period || "-"}</td>
          <td className="erp-td text-right font-medium text-slate-700 dark:text-slate-300">
            {formatCurrency(record.bankBalance || 0, "USD")}
          </td>
          <td className="erp-td text-right font-medium text-slate-700 dark:text-slate-300">
            {formatCurrency(record.bookBalance || 0, "USD")}
          </td>
          <td className={`erp-td text-right font-semibold ${hasGap ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {hasGap ? "Delta " : ""}
            {formatCurrency(Math.abs(record.difference || 0), "USD")}
          </td>
          <td className="erp-td">
            <span className={cfg.chip}>{cfg.label}</span>
          </td>
        </tr>
      );
    },
  });

  return (
    <StandardPageLayout
      title="Bank Reconciliation & Statement Feeds"
      subtitle="Reconcile bank statement balances with chart of accounts ledger entries and auto-ingest OFX/MT940/CSV feeds."
      eyebrow="Finance / Treasury"
      icon="settings"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Records", value: filtered.length, helper: "reconciliations" },
            { label: "Matched", value: matched, tone: "positive" },
            { label: "Unmatched", value: unmatched, tone: "danger" },
            { label: "Net Variance", value: formatCurrency(totalDiff, "USD"), tone: "warning" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          <button
            type="button"
            onClick={() => setShowFeedDrawer(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            Import Bank Feed
          </button>
          {list.headerTools}
          <ErpCreateButton label="New reconciliation" onClick={() => setShowForm(true)} />
        </>
      }
      filters={list.filterBar}
    >
      {error && <div className="erp-alert-error">{error}</div>}

      <CrudCard>{list.table}</CrudCard>

      {/* Manual Reconciliation Form Drawer */}
      <SideDrawer
        open={showForm}
        onClose={() => setShowForm(false)}
        title="New Bank Reconciliation"
        subtitle="Enter the bank statement closing balance to compare with the ledger."
        width="md"
        footer={
          <ErpDrawerFooter
            onCancel={() => setShowForm(false)}
            onSave={() => void handleReconcile()}
            saving={saving}
            saveLabel="Save Reconciliation"
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
            <label className="erp-label">Bank Statement Balance</label>
            <input
              className="erp-input mt-1"
              type="number"
              step="0.01"
              value={form.bankBalance}
              onChange={(e) => setForm({ ...form, bankBalance: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="erp-label">Book Balance</label>
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

      {/* Bank Feed Statement Ingestion Drawer */}
      <SideDrawer
        open={showFeedDrawer}
        onClose={() => setShowFeedDrawer(false)}
        title="Universal Bank Feed Ingestion"
        subtitle="Parse raw OFX, MT940, or CSV bank statement feeds directly into reconciliation transactions."
        width="lg"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setFeedFormat("ofx")}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  feedFormat === "ofx"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                OFX / QFX
              </button>
              <button
                type="button"
                onClick={() => setFeedFormat("mt940")}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  feedFormat === "mt940"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                MT940 (SWIFT)
              </button>
              <button
                type="button"
                onClick={() => setFeedFormat("csv")}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  feedFormat === "csv"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                Standard CSV
              </button>
            </div>

            <select
              value={feedCurrency}
              onChange={(e) => setFeedCurrency(e.target.value)}
              className="erp-select text-xs w-28"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
              <option value="AED">AED (د.إ)</option>
              <option value="CAD">CAD ($)</option>
            </select>
          </div>

          <div>
            <label className="erp-label block mb-1">
              Raw {feedFormat.toUpperCase()} Statement Content
            </label>
            <textarea
              className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 focus:border-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
              rows={8}
              value={feedContent}
              onChange={(e) => setFeedContent(e.target.value)}
              placeholder={
                feedFormat === "ofx"
                  ? "<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><CURDEF>USD<BANKTRANLIST><STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20260824<TRNAMT>4500.00<FITID>TXN987<NAME>ACME CORP PAYMENT</STMTTRN></BANKTRANLIST><LEDGERBAL><BALAMT>45000.00</LEDGERBAL></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>"
                  : ":25:1234567890\n:61:2608240824CR4500,00NTRFNONREF//TXN987\n:86:CUSTOMER PAYMENT RECEIVED\n:62F:C260824USD45000,00"
              }
            />
          </div>

          <button
            type="button"
            onClick={handleParseBankFeed}
            disabled={isParsingFeed}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            {isParsingFeed ? "Parsing Bank Feed..." : "Parse & Match Transactions"}
          </button>

          {parsedStatement && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Account Number</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {parsedStatement.accountNumber || "N/A"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Closing Balance</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {formatCurrency(parsedStatement.closingBalance, parsedStatement.currency)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                <span className="text-[10px] uppercase text-slate-400 font-bold block">
                  Extracted Transactions ({parsedStatement.transactions.length})
                </span>
                {parsedStatement.transactions.map((txn, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{txn.description}</span>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        Ref: {txn.referenceNumber} • {formatDateTime(txn.transactionDate)}
                      </span>
                    </div>
                    <span
                      className={`font-mono font-bold ${
                        txn.transactionType === "Credit" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {txn.transactionType === "Credit" ? "+" : "-"}
                      {formatCurrency(txn.amount, parsedStatement.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}

export default BankReconciliationManager;
