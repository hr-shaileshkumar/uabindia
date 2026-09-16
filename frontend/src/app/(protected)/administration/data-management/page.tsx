"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";

import React, { useState } from "react";
import Link from "next/link";
import {
  Database,
  HardDrive,
  Recycle,
  FileText,
  Inbox,
  Users,
  ShieldCheck,
  Building2,
  Package,
  Layers,
  ArrowUpRight,
  Download,
  Server,
  Lock,
  CheckCircle2,
  Globe,
  Webhook,
  Code,
  ShieldAlert,
} from "lucide-react";
import { AdministrationGlobalPageShell, type KpiMetricItem } from "@/components/administration/AdministrationGlobalPageShell";
import { ROUTES } from "@/constants/routes";
import { notifySuccess } from "@/lib/notifications";

const DATA_REGISTRIES = [
  {
    href: ROUTES.PLATFORM_COMPANIES,
    label: "Companies & Legal Entities",
    desc: "Export corporate entities, GSTIN profiles, and branch structures.",
    icon: Building2,
    count: "Active",
  },
  {
    href: ROUTES.PLATFORM_USERS,
    label: "Identity & User Accounts",
    desc: "Directory of tenant operators, RBAC assignments, and status.",
    icon: Users,
    count: "Protected",
  },
  {
    href: ROUTES.EMPLOYEES,
    label: "Employee Master Register",
    desc: "Core personnel profiles, designations, departments, and payroll mapping.",
    icon: Users,
    count: "Synced",
  },
  {
    href: ROUTES.CUSTOMERS,
    label: "Customers & Commercial Accounts",
    desc: "B2B client ledgers, contact directories, and billing addresses.",
    icon: Users,
    count: "CRM",
  },
  {
    href: ROUTES.ITEMS,
    label: "Item & Inventory Catalog",
    desc: "Stock keeping units, valuation rates, HSN codes, and warehouse mappings.",
    icon: Package,
    count: "ERP Master",
  },
  {
    href: ROUTES.PLATFORM_PRIVACY,
    label: "Data Privacy & GDPR/DPDP Vault",
    desc: "DPDP Act 2023 compliance, personal dossier export, and Right to Erasure.",
    icon: ShieldAlert,
    count: "Compliance",
  },
  {
    href: ROUTES.PLATFORM_MASTER_DATA,
    label: "Global Master Data & Jurisdictions",
    desc: "Country profiles, tax regimes, and industry extension packs.",
    icon: Globe,
    count: "Global",
  },
  {
    href: ROUTES.PLATFORM_WEBHOOKS,
    label: "Webhooks & Event Dispatcher",
    desc: "Real-time HTTP event dispatching with signature verification.",
    icon: Webhook,
    count: "Events",
  },
  {
    href: ROUTES.PLATFORM_EDI,
    label: "EDI X12 Integration Studio",
    desc: "B2B Electronic Data Interchange for 850 PO, 810 Invoice, and 856 ASN.",
    icon: Code,
    count: "ANSI X12",
  },
  {
    href: ROUTES.PLATFORM_RECYCLE_BIN,
    label: "Recycle Bin & Data Recovery",
    desc: "Soft-deleted records recovery center with 30-day purge buffer.",
    icon: Recycle,
    count: "Zero-Data-Loss",
  },
  {
    href: ROUTES.ADMINISTRATION_DOCUMENTS,
    label: "Enterprise Document Vault",
    desc: "Encrypted file repository, KYC attachments, and policy PDFs.",
    icon: FileText,
    count: "AES-256",
  },
  {
    href: "/platform/audit-logs",
    label: "Immutable Audit Trail",
    desc: "Security event stream, data mutations, and administrative overrides.",
    icon: ShieldCheck,
    count: "90-Day Log",
  },
];

function LegacyDataManagementPage() {
  const [search, setSearch] = useState("");

  const filteredRegistries = DATA_REGISTRIES.filter((r) =>
    !search || r.label.toLowerCase().includes(search.toLowerCase()) || r.desc.toLowerCase().includes(search.toLowerCase())
  );

  const kpis: KpiMetricItem[] = [
    { label: "Data Integrity", value: "100%", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "ACID Compliant" },
    { label: "Storage Engine", value: "MS SQL Server", tone: "info", icon: <Database className="h-3.5 w-3.5" />, subtext: "Relational + RCSI" },
    { label: "Tenant Isolation", value: "Enforced", tone: "positive", icon: <Lock className="h-3.5 w-3.5" />, subtext: "Row & Tenant Scope" },
    { label: "Recovery RPO", value: "< 15 Mins", tone: "positive", icon: <HardDrive className="h-3.5 w-3.5" />, subtext: "Continuous WAL" },
  ];

  return (
    <AdministrationGlobalPageShell
      title="Data Governance & Registry Management"
      subtitle="Enterprise master registers, multi-tenant isolation policies, and database compliance center."
      categoryTag="Data Architecture"
      icon="database"
      kpiMetrics={kpis}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Filter data registry or subsystem..."
    >
      <div className="p-6 space-y-6">
        {/* Governance Overview Banner */}
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-blue-50/40 to-slate-50 p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                  <Server className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-semibold text-slate-900">Unified Data Management & Export Policies</h3>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                All business records are stored with tenant-isolated database constraints and immutable audit tracking.
                Use the live registers below to browse, inspect, create, and export records with real-time permissions.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/platform/backup"
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
              >
                Backup Policies
              </Link>
              <Link
                href={ROUTES.PLATFORM_RECYCLE_BIN}
                className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                Open Recycle Bin
              </Link>
            </div>
          </div>
        </div>

        {/* Master Data Registers Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Live Enterprise Data Registers</h4>
            <span className="text-xs font-medium text-slate-400">{filteredRegistries.length} registries available</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredRegistries.map((reg) => (
              <Link
                key={reg.href}
                href={reg.href}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-400 hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-indigo-600 border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                      <reg.icon className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 font-mono">
                      {reg.count}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {reg.label}
                    </h5>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {reg.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-medium text-indigo-600">
                  <span>Open Registry</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdministrationGlobalPageShell>
  );
}

export default function DataManagementPage() {
  return (
    <DynamicPage
      pageKey="administration.data-management"
      fallback={<LegacyDataManagementPage />}
      renderMode="auto"
    />
  );
}
