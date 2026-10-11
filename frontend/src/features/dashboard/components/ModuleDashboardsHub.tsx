"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  Wallet,
  Briefcase,
  TrendingUp,
  Package,
  ShoppingCart,
  Landmark,
  BarChart3,
  ShieldCheck,
  UserCheck,
  ArrowUpRight,
  Search,
  Sparkles,
  Layers,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";

interface ModuleDashboardCard {
  id: string;
  title: string;
  subtitle: string;
  category: "talent" | "supply_chain" | "finance" | "governance";
  categoryLabel: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  badge: string;
  tags: string[];
  metricsPreview: string;
}

const DASHBOARD_CARDS: ModuleDashboardCard[] = [
  {
    id: "hrms",
    title: "HRMS Dashboard",
    subtitle: "Workforce & Biometrics Engine",
    category: "talent",
    categoryLabel: "People & Talent",
    description: "Real-time employee master, biometric attendance sync, leaves, shifts, performance, and onboarding workflows.",
    href: ROUTES.HRMS_HOME,
    icon: Users,
    gradient: "from-blue-600 to-indigo-600 text-blue-600 bg-blue-50 dark:bg-blue-950/60",
    badge: "Active",
    tags: ["Attendance", "Leave Engine", "360 Directory"],
    metricsPreview: "Live Workforce Attendance & Shifts",
  },
  {
    id: "payroll",
    title: "Payroll Dashboard",
    subtitle: "Compensation & Statutory Compliance",
    category: "talent",
    categoryLabel: "People & Talent",
    description: "Salary structures, automated monthly payroll runs, payslip generation, tax declarations, and statutory compliance.",
    href: ROUTES.PAYROLL_HOME,
    icon: Wallet,
    gradient: "from-emerald-600 to-teal-600 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60",
    badge: "100% Compliant",
    tags: ["Payroll Runs", "Payslips", "Tax Rules"],
    metricsPreview: "Zero-Error Salary Computations",
  },
  {
    id: "crm",
    title: "CRM Dashboard",
    subtitle: "Customer Relationships & Pipeline",
    category: "supply_chain",
    categoryLabel: "Sales & CRM",
    description: "End-to-end lead tracking, opportunity stages, conversion funnel telemetry, customer directory, and communications.",
    href: ROUTES.CRM_HOME,
    icon: Briefcase,
    gradient: "from-purple-600 to-violet-600 text-purple-600 bg-purple-50 dark:bg-purple-950/60",
    badge: "Live Telemetry",
    tags: ["Lead Scoring", "Deal Pipeline", "Accounts"],
    metricsPreview: "Active Deals & Sales Pipeline",
  },
  {
    id: "sales",
    title: "Sales Dashboard",
    subtitle: "Commercial & Revenue Operations",
    category: "supply_chain",
    categoryLabel: "Sales & CRM",
    description: "Sales quotation engine, verified orders, dispatch fulfillment, tax invoices, price lists, and receivables.",
    href: ROUTES.SALES_HOME,
    icon: TrendingUp,
    gradient: "from-sky-600 to-blue-600 text-sky-600 bg-sky-50 dark:bg-sky-950/60",
    badge: "High Growth",
    tags: ["Quotations", "Sales Orders", "Invoices"],
    metricsPreview: "Real-Time Revenue & Order Fulfillment",
  },
  {
    id: "inventory",
    title: "Inventory Dashboard",
    subtitle: "Warehouses & Stock Intelligence",
    category: "supply_chain",
    categoryLabel: "Supply Chain",
    description: "Multi-location warehouse balances, stock ledger, bin management, reorder thresholds, and physical valuation.",
    href: ROUTES.INVENTORY_HOME,
    icon: Package,
    gradient: "from-amber-600 to-orange-600 text-amber-600 bg-amber-50 dark:bg-amber-950/60",
    badge: "Stock Sync",
    tags: ["Warehouses", "SKU Catalog", "Stock Movements"],
    metricsPreview: "Low-Stock Alerts & Valuations",
  },
  {
    id: "procurement",
    title: "Procurement Dashboard",
    subtitle: "Purchasing & Vendor Management",
    category: "supply_chain",
    categoryLabel: "Supply Chain",
    description: "Requisition workflows, purchase orders, vendor pricing, goods receipt notes (GRN), and 3-way bill matching.",
    href: ROUTES.PROCUREMENT_HOME,
    icon: ShoppingCart,
    gradient: "from-rose-600 to-pink-600 text-rose-600 bg-rose-50 dark:bg-rose-950/60",
    badge: "Automated POs",
    tags: ["Purchase Orders", "Vendors", "GRN Flow"],
    metricsPreview: "Vendor SLA & Sourcing Pipeline",
  },
  {
    id: "finance",
    title: "Finance & Accounts",
    subtitle: "General Ledger & Treasury Engine",
    category: "finance",
    categoryLabel: "Finance & Accounts",
    description: "Chart of accounts, real-time journal entries, GST compliance, balance sheet, profit & loss, and bank reconciliations.",
    href: ROUTES.FINANCE_HOME,
    icon: Landmark,
    gradient: "from-teal-600 to-emerald-600 text-teal-600 bg-teal-50 dark:bg-teal-950/60",
    badge: "Double-Entry",
    tags: ["General Ledger", "P&L Statement", "GST Audit"],
    metricsPreview: "Real-Time Balance Sheet & Cash Flow",
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    subtitle: "Unified Enterprise BI Center",
    category: "finance",
    categoryLabel: "Finance & Accounts",
    description: "Executive cross-module reporting, operational throughput, drilldown financial queries, and automated exports.",
    href: ROUTES.REPORTS_HOME,
    icon: BarChart3,
    gradient: "from-indigo-600 to-blue-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60",
    badge: "Enterprise BI",
    tags: ["Executive BI", "Custom Queries", "Excel Exports"],
    metricsPreview: "Cross-Module Drilldown Analytics",
  },
  {
    id: "platform",
    title: "Platform Operations",
    subtitle: "Multi-Tenant SaaS Governance",
    category: "governance",
    categoryLabel: "Operations & Governance",
    description: "SQL Server tenant isolation, organization provisioning, RBAC policy enforcement, database clustering, and uptime.",
    href: "/platform/tenants",
    icon: ShieldCheck,
    gradient: "from-violet-600 to-purple-600 text-violet-600 bg-violet-50 dark:bg-violet-950/60",
    badge: "Super Admin",
    tags: ["Tenant Clusters", "RBAC Policies", "Cluster Health"],
    metricsPreview: "Isolated SQL Multi-Tenant Workspaces",
  },
  {
    id: "ess",
    title: "Employee Self-Service",
    subtitle: "Personal Workforce Portal",
    category: "talent",
    categoryLabel: "People & Talent",
    description: "Personal biometric punch clock, instant leave requests, downloadable payslips, tax declarations, and asset support.",
    href: ROUTES.EMPLOYEE_SELF_SERVICE,
    icon: UserCheck,
    gradient: "from-cyan-600 to-blue-600 text-cyan-600 bg-cyan-50 dark:bg-cyan-950/60",
    badge: "Self-Service",
    tags: ["Punch Clock", "My Leaves", "My Payslips"],
    metricsPreview: "Personal Attendance & Leaves Portal",
  },
];

interface ModuleDashboardsHubProps {
  onSwitchToTelemetry?: () => void;
  isSuperAdmin?: boolean;
}

export function ModuleDashboardsHub({ onSwitchToTelemetry, isSuperAdmin }: ModuleDashboardsHubProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "talent" | "supply_chain" | "finance" | "governance">("all");

  const filteredCards = useMemo(() => {
    return DASHBOARD_CARDS.filter((card) => {
      const matchesCategory = selectedCategory === "all" || card.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        card.title.toLowerCase().includes(query) ||
        card.subtitle.toLowerCase().includes(query) ||
        card.description.toLowerCase().includes(query) ||
        card.tags.some((tag) => tag.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <StandardPageLayout
      title="Enterprise Dashboards Command Center"
      subtitle="Unified operational hub — select and launch any functional ERP module dashboard."
      eyebrow="Dashboard"
      icon="dashboard"
      actions={
        isSuperAdmin && onSwitchToTelemetry ? (
          <button
            type="button"
            onClick={onSwitchToTelemetry}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Platform Telemetry Console</span>
          </button>
        ) : null
      }
    >
      {/* Top Search & Category Filter Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All Dashboards", count: DASHBOARD_CARDS.length },
            { id: "talent", label: "Talent & HR", count: 3 },
            { id: "supply_chain", label: "Supply Chain & Sales", count: 4 },
            { id: "finance", label: "Finance & BI", count: 2 },
            { id: "governance", label: "Platform & Admin", count: 1 },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as typeof selectedCategory)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0",
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              )}
            >
              <span>{cat.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                  selectedCategory === cat.id
                    ? "bg-white/20 text-white"
                    : "bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                )}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px] sm:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dashboards or tags…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8.5 pr-3 py-1.5 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Grid of All Module Dashboard Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {filteredCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700"
            >
              <div>
                {/* Top Row: Icon + Badge */}
                <div className="flex items-center justify-between">
                  <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xs transition-transform duration-200 group-hover:scale-105", card.gradient)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {card.badge}
                  </span>
                </div>

                {/* Title & Category */}
                <div className="mt-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {card.categoryLabel}
                  </p>
                  <h3 className="mt-0.5 text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors dark:text-slate-100 dark:group-hover:text-indigo-400">
                    {card.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {card.subtitle}
                  </p>
                </div>

                {/* Description */}
                <p className="mt-2.5 text-xs text-slate-600 leading-relaxed dark:text-slate-300 line-clamp-2">
                  {card.description}
                </p>

                {/* Feature Tags */}
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {card.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200/60 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Action Row: Direct Launch Button */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href={card.href}
                  className="inline-flex w-full items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 transition-all duration-200 hover:bg-indigo-600 hover:text-white hover:shadow-md group-hover:bg-indigo-600 group-hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-indigo-600"
                >
                  <span>Open {card.title}</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCards.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No module dashboards matched &quot;{searchQuery}&quot;</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="mt-3 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Reset search and filters
          </button>
        </div>
      )}
    </StandardPageLayout>
  );
}
