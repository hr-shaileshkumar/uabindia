"use client";

import Link from "next/link";
import { ArrowUpRight, BarChart3, Shield, Wallet, Building2, FileSpreadsheet } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import HeaderSummary from "@/components/layout/HeaderSummary";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useReportsDashboard } from "@/features/reports/hooks/useReportsDashboard";

const formatCurrency = (value?: number) =>
  value != null ? `Rs${value.toLocaleString("en-IN")}` : "-";

const REPORT_CATALOG = [
  {
    title: "HR Analytics",
    description: "Headcount, attendance trends, and leave analysis.",
    href: ROUTES.REPORTS_HR,
    icon: BarChart3,
  },
  {
    title: "Payroll Reports",
    description: "Monthly payroll runs, disbursements, and component breakdown.",
    href: ROUTES.REPORTS_PAYROLL,
    icon: Wallet,
  },
  {
    title: "Compliance & Governance",
    description: "Audit trails, data quality scores, and module usage.",
    href: ROUTES.REPORTS_COMPLIANCE,
    icon: Shield,
  },
  {
    title: "Operations Reports",
    description: "Customers, vendors, inventory, and order summaries.",
    href: ROUTES.REPORTS_OPERATIONS,
    icon: Building2,
  },
  {
    title: "Financial Reports",
    description: "Chart of accounts balances and journal activity.",
    href: ROUTES.REPORTS_FINANCIAL,
    icon: FileSpreadsheet,
  },
  {
    title: "Custom Reports",
    description: "Saved report definitions and scheduled exports.",
    href: ROUTES.REPORTS_CUSTOM,
    icon: FileSpreadsheet,
  },
] as const;

export default function ReportsCenterPage() {
  const { data, isLoading, isError, error, refetch } = useReportsDashboard();

  return (
    <StandardPageLayout
      title="Reports Center & Analytics Hub"
      subtitle="Live workforce, payroll, and governance metrics with quick access to analytics modules."
      eyebrow="Reports / Analytics Hub"
      icon="bar-chart"
      meta={
        <HeaderSummary
          items={[
            { label: "Employees", value: data?.hr?.totalEmployees ?? (isLoading ? "…" : "-"), tone: "info" },
            { label: "Active", value: data?.hr?.activeEmployees ?? (isLoading ? "…" : "-"), tone: "success" },
            { label: "Today's Attendance", value: data?.hr?.todayAttendance ?? (isLoading ? "…" : "-"), tone: "info" },
            { label: "Payroll Payout", value: isLoading ? "…" : formatCurrency(data?.payroll?.totalPayout), tone: "warning" },
          ]}
        />
      }
      filters={
        <button type="button" className="erp-btn-secondary" onClick={() => void refetch()} disabled={isLoading}>
          Refresh
        </button>
      }
    >
      {isError && (
        <div className="erp-alert-error">{getApiErrorMessage(error, "Failed to load reports dashboard.")}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORT_CATALOG.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-slate-700" />
              </div>
              <h2 className="mt-4 text-sm font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-1 text-xs text-slate-500">{item.description}</p>
            </Link>
          );
        })}
      </div>

      {data?.timestamp && (
        <p className="mt-6 text-xs text-slate-400">
          Dashboard refreshed {new Date(data.timestamp).toLocaleString("en-IN")}
        </p>
      )}
    </StandardPageLayout>
  );
}
