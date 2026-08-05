"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  BarChart3,
  BookOpen,
  DollarSign,
  Landmark,
  Receipt,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { PageHeader } from "@/design-system";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { StatusBadge } from "@/components/erp/status-badge";
import { ROUTES } from "@/constants/routes";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type AccountBalance = {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  closingBalance: number;
  isGroup: boolean;
};

type PaymentRecord = {
  id: string;
  paymentDate?: string;
  amount?: number;
  paymentType?: string;
  status?: string;
  referenceNumber?: string;
};

const formatCurrency = (value?: number) =>
  value != null ? `₹${value.toLocaleString("en-IN")}` : "₹0";

const MODULE_LINKS = [
  { href: ROUTES.CHART_OF_ACCOUNTS, label: "Chart of Accounts", icon: BookOpen, desc: "Manage chart of accounts and ledger structure" },
  { href: ROUTES.JOURNAL_ENTRIES, label: "Journal Entries", icon: BookOpen, desc: "Record daily transactions and adjustments" },
  { href: ROUTES.PAYMENTS, label: "Payments", icon: DollarSign, desc: "Track incoming and outgoing payments" },
  { href: ROUTES.INVOICES, label: "Invoices", icon: Receipt, desc: "Manage customer invoices and billing" },
  { href: ROUTES.EXPENSES, label: "Expenses", icon: TrendingDown, desc: "Monitor operational expenses" },
  { href: ROUTES.BANK_RECONCILIATION, label: "Bank Reconciliation", icon: Landmark, desc: "Reconcile bank statements with ledgers" },
  { href: ROUTES.TAX_MANAGEMENT, label: "Tax Management", icon: Receipt, desc: "Track GST, TDS, and statutory filings" },
];

export default function FinanceDashboardPage() {
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [coaRes, balRes, payRes] = await Promise.all([
        hrApi.erp.chartOfAccounts.getAll().catch(() => ({ data: [] })),
        hrApi.erp.chartOfAccounts.getBalances().catch(() => ({ data: [] })),
        hrApi.erp.payments.list().catch(() => ({ data: [] })),
      ]);

      const _coaList = Array.isArray(coaRes.data) ? coaRes.data : [];
      const balanceList = Array.isArray(balRes.data) ? balRes.data : [];
      const paymentList = Array.isArray(payRes.data) ? payRes.data : Array.isArray(payRes.data?.data) ? payRes.data.data : [];

      setBalances(balanceList);
      setPayments(paymentList);
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load finance data.");
      setError(message);
      notifyError(message, "Finance");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const { totalAssets, totalLiabilities: _totalLiabilities, totalRevenue, totalExpenses, netPosition } = useMemo(() => {
    const assets = balances
      .filter((b) => ["Asset", "Current Asset", "Fixed Asset", "Bank"].includes(b.accountType))
      .reduce((sum, b) => sum + (b.closingBalance || 0), 0);
    const liabilities = balances
      .filter((b) => ["Liability", "Current Liability", "Long Term Liability"].includes(b.accountType))
      .reduce((sum, b) => sum + Math.abs(b.closingBalance || 0), 0);
    const revenue = balances
      .filter((b) => ["Revenue", "Income"].includes(b.accountType))
      .reduce((sum, b) => sum + (b.closingBalance || 0), 0);
    const expenses = balances
      .filter((b) => ["Expense", "Direct Expense", "Indirect Expense"].includes(b.accountType))
      .reduce((sum, b) => sum + Math.abs(b.closingBalance || 0), 0);
    return {
      totalAssets: assets,
      totalLiabilities: liabilities,
      totalRevenue: revenue,
      totalExpenses: expenses,
      netPosition: assets - liabilities,
    };
  }, [balances]);

  const recentPayments = payments.slice(0, 5);
  const pendingPayments = payments.filter((p) => (p.status || "").toLowerCase() === "pending").length;

  return (
    <div className="erp-page space-y-5">
      <PageHeader
        title="Financial Management"
        subtitle="Financial overview, account balances, and cash position for the current period."
        eyebrow="ERP / Finance"
        icon="bank"
        stats={[
          { label: "Accounts", value: balances.length },
          { label: "Payments", value: payments.length, tone: "info" },
          { label: "Pending", value: pendingPayments, tone: "warning" },
          { label: "Net Position", value: formatCurrency(netPosition), tone: netPosition >= 0 ? "success" : "danger" },
        ]}
      />
      {error && <div className="erp-alert-error">{error}</div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Assets", value: formatCurrency(totalAssets), icon: Banknote, tone: "info", href: ROUTES.CHART_OF_ACCOUNTS },
          { label: "Revenue", value: formatCurrency(totalRevenue), icon: TrendingUp, tone: "success", href: ROUTES.JOURNAL_ENTRIES },
          { label: "Expenses", value: formatCurrency(totalExpenses), icon: TrendingDown, tone: "danger", href: ROUTES.EXPENSES },
          { label: "Net Position", value: formatCurrency(netPosition), icon: BarChart3, tone: netPosition >= 0 ? "positive" : "danger", href: ROUTES.BANK_RECONCILIATION },
        ].map((kpi) => (
          <Link key={kpi.label} href={kpi.href} className="erp-kpi-card erp-kpi-card-info block transition hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <p className="erp-kpi-label">{kpi.label}</p>
              <kpi.icon className={`h-5 w-5 ${kpi.tone === "success" ? "text-emerald-500" : kpi.tone === "danger" ? "text-red-500" : "text-teal-500"}`} />
            </div>
            <p className={`erp-kpi-value erp-kpi-value-${kpi.tone === "danger" ? "danger" : "success"}`}>{kpi.value}</p>
            <p className="erp-kpi-meta">Click to manage →</p>
          </Link>
        ))}
      </div>

      {/* Module Links + Recent Payments */}
      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        {/* Module Links */}
        <div className="erp-panel">
          <div className="erp-panel-header">
            <h2 className="erp-panel-title">Finance Modules</h2>
            <StatusBadge tone="info">{MODULE_LINKS.length} areas</StatusBadge>
          </div>
          <div className="p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {MODULE_LINKS.map((module) => (
                <Link
                  key={module.href}
                  href={module.href}
                  className="group flex items-start gap-3 rounded-xl border-2 border-[var(--erp-border)] p-3.5 transition hover:border-[var(--erp-primary)] hover:bg-[var(--erp-info-bg)]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--erp-primary-muted)] text-[var(--erp-primary)]">
                    <module.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-[var(--erp-ink)] group-hover:text-[var(--erp-primary)]">{module.label}</p>
                    <p className="mt-0.5 text-xs text-[var(--erp-muted)]">{module.desc}</p>
                  </div>
                  <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--erp-muted-soft)] transition group-hover:text-[var(--erp-primary)]" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="erp-panel">
          <div className="erp-panel-header">
            <h2 className="erp-panel-title">Recent Payments</h2>
            <Link href={ROUTES.PAYMENTS} className="text-xs font-bold text-[var(--erp-primary)] hover:underline">View all</Link>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-sm text-[var(--erp-muted)]">Loading...</div>
            ) : recentPayments.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-[var(--erp-muted)]">
                <DollarSign className="h-8 w-8 text-[var(--erp-muted-soft)]" />
                <p>No payments recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-lg border-2 border-[var(--erp-border)] px-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-[var(--erp-ink)]">{payment.referenceNumber || payment.paymentType || "Payment"}</p>
                      <p className="text-xs text-[var(--erp-muted)]">
                        {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("en-IN") : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[var(--erp-ink)]">{formatCurrency(payment.amount)}</p>
                      <StatusBadge tone={payment.status === "Completed" || payment.status === "Approved" ? "positive" : payment.status === "Pending" ? "warning" : "neutral"}>
                        {payment.status || "Draft"}
                      </StatusBadge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Summary */}
      <div className="erp-panel">
        <div className="erp-panel-header">
          <h2 className="erp-panel-title">Balance Summary</h2>
          <Link href={ROUTES.CHART_OF_ACCOUNTS} className="text-xs font-bold text-[var(--erp-primary)] hover:underline">Full chart →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Account</th>
                <th className="erp-th">Code</th>
                <th className="erp-th">Type</th>
                <th className="erp-th text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={4} className="erp-td"><div className="h-4 animate-pulse rounded bg-slate-100" /></td></tr>
                ))
              ) : balances.length === 0 ? (
                <tr><td colSpan={4} className="erp-td py-12 text-center text-sm text-[var(--erp-muted)]">No account balances found.</td></tr>
              ) : (
                balances.slice(0, 10).map((account) => (
                  <tr key={account.accountId} className="erp-tr">
                    <td className="erp-td font-semibold text-[var(--erp-ink)]">{account.accountName}</td>
                    <td className="erp-td font-mono text-xs text-[var(--erp-muted)]">{account.accountCode}</td>
                    <td className="erp-td"><span className="erp-chip erp-chip-neutral text-[10px]">{account.accountType}</span></td>
                    <td className={`erp-td text-right font-bold ${(account.closingBalance || 0) >= 0 ? "text-[var(--erp-success)]" : "text-[var(--erp-danger)]"}`}>
                      {formatCurrency(account.closingBalance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
