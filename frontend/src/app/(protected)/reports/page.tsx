"use client";

import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";

const REPORT_TILES = [
  {
    href: "/reports/hr",
    title: "HR Analytics",
    description: "Headcount, attendance trends, leave analysis, turnover rates, and workforce planning insights.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    meta: "People analytics",
    color: "from-blue-500/10 to-blue-600/5 border-blue-200/60",
    iconBg: "bg-blue-50 text-blue-600",
  },
  {
    href: "/reports/payroll",
    title: "Payroll Reports",
    description: "Salary structure breakdowns, payout trends, deduction summaries, and payroll period comparisons.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path strokeLinecap="round" d="M6 10h4M6 14h8" />
      </svg>
    ),
    meta: "Finance operations",
    color: "from-emerald-500/10 to-emerald-600/5 border-emerald-200/60",
    iconBg: "bg-emerald-50 text-emerald-600",
  },
  {
    href: "/reports/financial",
    title: "Financial Reports",
    description: "Profit & loss, receivables, payables, balance sheet snapshots, and period-over-period comparisons.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2 0-3.5.9-3.5 2.2 0 1.5 1.3 2.1 3.5 2.6 2.2.5 3.5 1.1 3.5 2.6 0 1.3-1.5 2.2-3.5 2.2S8.5 16.7 8.5 15.4M12 5v14" />
      </svg>
    ),
    meta: "Accounting & finance",
    color: "from-violet-500/10 to-violet-600/5 border-violet-200/60",
    iconBg: "bg-violet-50 text-violet-600",
  },
  {
    href: "/reports/compliance",
    title: "Compliance Reports",
    description: "Statutory filings status, audit-ready logs, data quality metrics, and module usage analytics.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    meta: "Governance & risk",
    color: "from-amber-500/10 to-amber-600/5 border-amber-200/60",
    iconBg: "bg-amber-50 text-amber-600",
  },
  {
    href: "/reports/erp",
    title: "Business Operations Reports",
    description: "Sales performance, purchase analysis, inventory levels, and operational efficiency across modules.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M8 17V9m4 8V5m4 12v-6" />
      </svg>
    ),
    meta: "Business operations",
    color: "from-sky-500/10 to-sky-600/5 border-sky-200/60",
    iconBg: "bg-sky-50 text-sky-600",
  },
  {
    href: "/reports/custom",
    title: "Custom Reports",
    description: "Build and schedule custom cross-module reports with configurable filters, groupings, and exports.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    meta: "Self-service BI",
    color: "from-rose-500/10 to-rose-600/5 border-rose-200/60",
    iconBg: "bg-rose-50 text-rose-600",
  },
] as const;

export default function ReportsDashboardPage() {
  return (
    <StandardPageLayout
      title="Analytics & Reports"
      subtitle="Unified insight layer for HR, payroll, compliance, finance, and executive decision-making."
      eyebrow="Analytics"
      icon="bar-chart"
    >
      {/* Hero Banner */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Analytics Center</p>
            <h2 className="mt-2 text-2xl font-bold">Data-driven decisions start here</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
              Access pre-built and custom reports across every module. Export to Excel, schedule deliveries, and share with stakeholders.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/reports/hr" className="erp-action-btn erp-action-btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/20">
              HR Analytics
            </Link>
            <Link href="/reports/custom" className="erp-action-btn erp-action-btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/20">
              Custom Report
            </Link>
          </div>
        </div>
      </div>

      {/* Report Tiles Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REPORT_TILES.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition hover:-translate-y-0.5 hover:shadow-lg ${tile.color}`}
          >
            <div className="flex items-start justify-between">
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${tile.iconBg}`}>
                {tile.icon}
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/60 bg-white/80 text-slate-400 opacity-0 transition group-hover:opacity-100">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </span>
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">{tile.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{tile.description}</p>
            <div className="mt-4 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{tile.meta}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Stats Bar */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-6">
        <p className="mb-4 text-sm font-semibold text-slate-700">Available Report Categories</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {REPORT_TILES.map((tile) => (
            <Link key={tile.href} href={tile.href} className="group flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-center transition hover:border-slate-200 hover:bg-white hover:shadow-sm">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${tile.iconBg}`}>
                {tile.icon}
              </div>
              <span className="text-xs font-semibold text-slate-700">{tile.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </StandardPageLayout>
  );
}
