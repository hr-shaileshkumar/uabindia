"use client";

import Link from "next/link";
import { ArrowRight, Building2, ClipboardList, Shield, Users } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { ROUTES } from "@/constants/routes";

const quickLinks = [
  {
    title: "Platform console",
    description: "Open tenant governance, module mapping, and system configuration.",
    href: ROUTES.PLATFORM_HOME,
    icon: Building2,
  },
  {
    title: "Tenant management",
    description: "Review companies, tenants, and projects across the SaaS workspace.",
    href: ROUTES.PLATFORM_TENANTS,
    icon: Users,
  },
  {
    title: "Security and audit",
    description: "Inspect sessions, access logs, and policy surfaces.",
    href: ROUTES.SECURITY_HOME,
    icon: Shield,
  },
  {
    title: "Operations review",
    description: "Jump into reports, notifications, and workflow-driven back-office screens.",
    href: ROUTES.REPORTS_HOME,
    icon: ClipboardList,
  },
];

const adminTargets = [
  { label: "Module registry", href: ROUTES.PLATFORM_MODULE_MAPPING },
  { label: "Users", href: ROUTES.PLATFORM_USERS },
  { label: "Companies", href: ROUTES.PLATFORM_COMPANIES },
  { label: "Feature flags", href: ROUTES.PLATFORM_FEATURE_FLAGS },
  { label: "Audit logs", href: ROUTES.AUDIT_LOGS },
  { label: "System health", href: ROUTES.PLATFORM_SYSTEM_HEALTH },
];

export default function SuperAdminDashboardPage() {
  return (
    <StandardPageLayout
      eyebrow="Software Owner Console"
      title="SuperAdmin Dashboard"
      subtitle="Central command surface for platform ownership, tenant oversight, security review, and release operations."
      icon="shield"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {quickLinks.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--erp-shadow-sm)] transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-sky-700" />
            </div>
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--erp-shadow-sm)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Fast access</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">Core admin destinations</h2>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {adminTargets.map((target) => (
            <Link
              key={target.label}
              href={target.href}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
            >
              {target.label}
            </Link>
          ))}
        </div>
      </section>
    </StandardPageLayout>
  );
}
