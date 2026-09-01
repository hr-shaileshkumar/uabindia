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
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
import {
  erpActionCardClassName,
  erpActionCardIconClassName,
  erpActionCardSubtitleClassName,
  erpActionCardTitleClassName,
  erpPanelBodyClassName,
  erpPanelClassName,
  erpPanelHeaderClassName,
  erpPanelTitleClassName,
  erpStatCardClassName,
  erpStatCardHelperClassName,
  erpStatCardLabelClassName,
  erpStatCardValueClassName,
  erpStatusBadgeTone,
} from "@/components/workspace/styles";
import { ROUTES } from "@/constants/routes";
import { financeApi } from "@/services/modules";
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
  { href: ROUTES.CHART_OF_ACCOUNTS, label: "Chart of Accounts", icon: BookOpen, desc: "Ledger structure and balances" },
  { href: ROUTES.JOURNAL_ENTRIES, label: "Journal Entries", icon: BookOpen, desc: "Record daily transactions" },
  { href: ROUTES.PAYMENTS, label: "Payments", icon: DollarSign, desc: "Incoming and outgoing payments" },
  { href: ROUTES.INVOICES, label: "Invoices", icon: Receipt, desc: "Customer billing" },
  { href: ROUTES.ACCOUNTING_PERIODS, label: "Accounting Periods", icon: Landmark, desc: "Open and close monthly books" },
  { href: ROUTES.EXPENSES, label: "Expenses", icon: TrendingDown, desc: "Operational expenses" },
  { href: ROUTES.BANK_RECONCILIATION, label: "Bank Reconciliation", icon: Landmark, desc: "Reconcile bank statements" },
  { href: ROUTES.TAX_MANAGEMENT, label: "Tax Management", icon: Receipt, desc: "GST, TDS, and statutory filings" },
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

      const [balRes, payRes] = await Promise.all([
        financeApi.chartOfAccounts.getBalances().catch(() => ({ data: [] })),
        financeApi.payments.list().catch(() => ({ data: [] })),
      ]);

      const balanceList = Array.isArray(balRes.data) ? balRes.data : [];
      const paymentList = Array.isArray(payRes.data)
        ? payRes.data
        : Array.isArray(payRes.data?.data)
          ? payRes.data.data
          : [];

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

  useEffect(() => {
    void load();
  }, [load]);

  const { totalAssets, totalRevenue, totalExpenses, netPosition } = useMemo(() => {
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
      totalRevenue: revenue,
      totalExpenses: expenses,
      netPosition: assets - liabilities,
    };
  }, [balances]);

  const recentPayments = payments.slice(0, 5);
  const pendingPayments = payments.filter((p) => (p.status || "").toLowerCase() === "pending").length;

  return (
    <StandardPageLayout
      title="Finance"
      subtitle="Account balances, payments, and financial module navigation."
      eyebrow="ERP / Finance"
      icon="bank"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Accounts", value: loading ? "…" : balances.length, helper: "ledger" },
            { label: "Payments", value: loading ? "…" : payments.length, tone: "info" },
            { label: "Pending", value: loading ? "…" : pendingPayments, tone: pendingPayments > 0 ? "warning" : "positive" },
            { label: "Net Position", value: loading ? "…" : formatCurrency(netPosition), tone: "info" },
          ]}
        />
      }
    >
      {error ? (
        <div className="erp-alert-error">{error}</div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total assets", value: formatCurrency(totalAssets), icon: Banknote, href: ROUTES.CHART_OF_ACCOUNTS },
          { label: "Revenue", value: formatCurrency(totalRevenue), icon: TrendingUp, href: ROUTES.JOURNAL_ENTRIES },
          { label: "Expenses", value: formatCurrency(totalExpenses), icon: TrendingDown, href: ROUTES.EXPENSES },
          { label: "Net position", value: formatCurrency(netPosition), icon: BarChart3, href: ROUTES.BANK_RECONCILIATION },
        ].map((kpi) => (
          <Link key={kpi.label} href={kpi.href} className={`${erpStatCardClassName} block transition hover:border-slate-300`}>
            <div className="flex items-center justify-between">
              <p className={erpStatCardLabelClassName}>{kpi.label}</p>
              <kpi.icon className="h-5 w-5 text-slate-400" />
            </div>
            <p className={erpStatCardValueClassName}>{loading ? "…" : kpi.value}</p>
            <p className={erpStatCardHelperClassName}>View details</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <section className={erpPanelClassName}>
          <div className={erpPanelHeaderClassName}>
            <h2 className={erpPanelTitleClassName}>Finance modules</h2>
            <span className={erpStatusBadgeTone.info}>{MODULE_LINKS.length} areas</span>
          </div>
          <div className={erpPanelBodyClassName}>
            <div className="grid gap-3 sm:grid-cols-2">
              {MODULE_LINKS.map((module) => (
                <Link key={module.href} href={module.href} className={`${erpActionCardClassName} group flex items-start gap-3`}>
                  <span className={erpActionCardIconClassName}>
                    <module.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={erpActionCardTitleClassName}>{module.label}</p>
                    <p className={erpActionCardSubtitleClassName}>{module.desc}</p>
                  </div>
                  <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:text-slate-700" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={erpPanelClassName}>
          <div className={erpPanelHeaderClassName}>
            <h2 className={erpPanelTitleClassName}>Recent payments</h2>
            <Link href={ROUTES.PAYMENTS} className="text-xs font-semibold text-slate-700 hover:text-slate-900">
              View all
            </Link>
          </div>
          <div className={erpPanelBodyClassName}>
            {loading ? (
              <div className="py-8 text-center text-sm text-slate-500">Loading…</div>
            ) : recentPayments.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-slate-500">
                <DollarSign className="h-8 w-8 text-slate-300" />
                <p>No payments recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {payment.referenceNumber || payment.paymentType || "Payment"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {payment.paymentDate
                          ? new Date(payment.paymentDate).toLocaleDateString("en-IN")
                          : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(payment.amount)}</p>
                      <span className={erpStatusBadgeTone.neutral}>{payment.status || "Draft"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </StandardPageLayout>
  );
}
