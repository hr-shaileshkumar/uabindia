"use client";

import {
  BookOpen,
  Receipt,
  Landmark,
  BarChart3,
  CalendarDays,
  TrendingUp,
  DollarSign,
  CreditCard,
  FileText,
} from "lucide-react";
import { UabModuleDashboard } from "@/components/dynamic/UabModuleDashboard";
import { ROUTES } from "@/constants/routes";

const LINKS = [
  { href: ROUTES.CHART_OF_ACCOUNTS, label: "Chart of Accounts", icon: BookOpen, desc: "Ledger structure and balances" },
  { href: ROUTES.JOURNAL_ENTRIES, label: "Journal Entries", icon: FileText, desc: "Double-entry vouchers and posting" },
  { href: "/finance/budgeting", label: "Budgeting", icon: BarChart3, desc: "Departmental budgets and variance" },
  { href: "/finance/bank-reconciliation", label: "Bank Reconciliation", icon: Landmark, desc: "Match statements to book records" },
  { href: "/finance/gst", label: "GST Compliance", icon: Receipt, desc: "GST returns, TDS, and filings" },
  { href: "/expenses", label: "Expense Claims", icon: Receipt, desc: "Travel & corporate expense approvals" },
  { href: "/accounting-periods", label: "Accounting Periods", icon: CalendarDays, desc: "Fiscal calendar and period locks" },
  { href: "/finance/consolidation", label: "Consolidation", icon: Landmark, desc: "Multi-entity financial consolidation" },
];

export default function FinancePage() {
  return (
    <UabModuleDashboard
      moduleKey="finance"
      title="Finance & Accounting"
      subtitle="General ledger, budgets, receivables, payables, GST compliance, and financial reporting."
      eyebrow="Finance"
      icon={DollarSign}
      color="from-emerald-600 via-teal-600 to-cyan-600"
      statsEndpoint="/finance/dashboard/stats"
      statsMapper={(data) => [
        { label: "Total Assets", value: data?.totalAssets ? `₹${Number(data.totalAssets).toLocaleString("en-IN")}` : "—", icon: Landmark, tone: "positive" },
        { label: "YTD Revenue", value: data?.ytdRevenue ? `₹${Number(data.ytdRevenue).toLocaleString("en-IN")}` : "—", icon: TrendingUp, tone: "positive", trend: data?.revenueTrend },
        { label: "Outstanding AR", value: data?.outstandingAR ? `₹${Number(data.outstandingAR).toLocaleString("en-IN")}` : "—", icon: CreditCard, tone: "warning" },
        { label: "Pending Expenses", value: data?.pendingExpenses ?? 0, icon: Receipt, tone: "info" },
      ]}
      kpis={[
        { label: "Total Assets", value: "—", icon: Landmark, tone: "positive" },
        { label: "YTD Revenue", value: "—", icon: TrendingUp, tone: "positive" },
        { label: "Outstanding AR", value: "—", icon: CreditCard, tone: "warning" },
        { label: "Pending Expenses", value: "—", icon: Receipt, tone: "info" },
      ]}
      links={LINKS}
      linksTitle="Finance Workspaces"
      activityEndpoint="/finance/activity"
    />
  );
}
