"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, ShieldAlert, Activity, Plus, Server, Database, RefreshCw, AlertCircle, Cpu } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import {
  erpActionCardClassName,
  erpActionCardIconClassName,
  erpActionCardSubtitleClassName,
  erpActionCardTitleClassName,
  erpButtonClassName,
  erpStatCardClassName,
  erpStatCardHelperClassName,
  erpStatCardLabelClassName,
  erpStatCardValueClassName,
} from "@/components/erp/erpStyles";
import { platformApi } from "@/services/modules/platform";
import { notifyError } from "@/lib/notifications";

interface TenantData {
  id: string;
  name: string;
  subdomain: string;
  subscriptionPlan?: string;
  isActive?: boolean;
  status?: string;
  createdAt?: string;
}

const PLATFORM_LINKS = [
  { href: "/superadmin/dashboard", icon: Building2, title: "Tenant management", subtitle: "Provision and configure organizations" },
  { href: "/platform/roles", icon: Cpu, title: "Roles & permissions", subtitle: "Global RBAC policy matrix" },
  { href: "/platform/audit-logs", icon: Server, title: "Audit logs", subtitle: "Cross-tenant security events" },
  { href: "/platform/settings", icon: Database, title: "Platform settings", subtitle: "Localization and branding defaults" },
];

export function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [tenantsRes, healthRes] = await Promise.allSettled([
        platformApi.superadmin.tenants(1, 100),
        platformApi.admin.systemHealth(),
      ]);

      if (tenantsRes.status === "fulfilled") {
        const rawList = tenantsRes.value.data?.data || tenantsRes.value.data?.tenants || [];
        setTenants(rawList);
      } else {
        notifyError("Could not connect to tenant registry service.");
        setError("Unable to load tenant registry.");
      }

      if (healthRes.status === "fulfilled") {
        setHealthStatus(healthRes.value.data?.status ?? "Unknown");
      } else {
        setHealthStatus(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch platform dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboardData();
  }, []);

  const activeTenantsCount = useMemo(
    () => tenants.filter((t) => t.isActive ?? t.status === "active").length,
    [tenants]
  );

  const suspendedTenantsCount = useMemo(
    () => tenants.filter((t) => !(t.isActive ?? t.status === "active")).length,
    [tenants]
  );

  const planBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    tenants.forEach((t) => {
      const plan = t.subscriptionPlan || "Unspecified";
      counts[plan] = (counts[plan] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [tenants]);

  return (
    <StandardPageLayout
      title="Platform overview"
      subtitle="Tenant registry, system health, and platform administration."
      eyebrow="Super admin"
      icon="shield"
      actions={
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void fetchDashboardData()} className={erpButtonClassName.secondary}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link href="/superadmin/dashboard" className={erpButtonClassName.primary}>
            <Plus className="h-4 w-4" />
            Provision tenant
          </Link>
        </div>
      }
    >
      {error ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => void fetchDashboardData()} className={erpButtonClassName.secondary}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
            ))
          : [
              { label: "Registered tenants", value: String(tenants.length), note: "Organizations in registry", icon: Building2 },
              { label: "Active tenants", value: String(activeTenantsCount), note: "Operational organizations", icon: Activity },
              { label: "System health", value: healthStatus ?? "—", note: "Gateway API status", icon: Server },
              { label: "Suspended", value: String(suspendedTenantsCount), note: "Blocked tenant access", icon: ShieldAlert },
            ].map((stat) => (
              <div key={stat.label} className={erpStatCardClassName}>
                <div className="flex items-center justify-between gap-2">
                  <p className={erpStatCardLabelClassName}>{stat.label}</p>
                  <stat.icon className="h-4 w-4 text-slate-400" />
                </div>
                <p className={erpStatCardValueClassName}>{stat.value}</p>
                <p className={erpStatCardHelperClassName}>{stat.note}</p>
              </div>
            ))}
      </div>

      {!loading && planBreakdown.length > 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className={erpStatCardLabelClassName}>Subscription plans</p>
          <div className="mt-3 space-y-2">
            {planBreakdown.map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span className="font-medium text-slate-900">{plan}</span>
                <span className="text-slate-500">{count} tenant{count === 1 ? "" : "s"}</span>
              </div>
            ))}
          </div>
        </section>
      ) : !loading ? (
        <p className="text-sm text-slate-500">No subscription plan data available.</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORM_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={erpActionCardClassName}>
            <div className="flex items-center gap-3">
              <span className={erpActionCardIconClassName}>
                <link.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className={erpActionCardTitleClassName}>{link.title}</p>
                <p className={erpActionCardSubtitleClassName}>{link.subtitle}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </StandardPageLayout>
  );
}

export default SuperAdminDashboard;
