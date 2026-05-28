"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hrApi } from "@/services/hrApi";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/constants/routes";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";

type SuperAdminStats = {
  tenants: number;
  companies: number;
  users: number;
  projects: number;
};

const initialStats: SuperAdminStats = {
  tenants: 0,
  companies: 0,
  users: 0,
  projects: 0,
};

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { isSuperAdmin, loading } = useAuth();
  const [stats, setStats] = useState<SuperAdminStats>(initialStats);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.replace("/not-authorized");
    }
  }, [isSuperAdmin, loading, router]);

  useEffect(() => {
    let active = true;

    const loadStats = async () => {
      setLoadingStats(true);
      setError(null);

      try {
        const [tenantsRes, usersRes, companiesRes, projectsRes] = await Promise.all([
          hrApi.platform.tenants(true),
          hrApi.platform.users(true),
          hrApi.company.getAllForSuperAdmin(),
          hrApi.project.getAll(),
        ]);

        if (!active) return;

        setStats({
          tenants: Array.isArray(tenantsRes.data?.tenants) ? tenantsRes.data.tenants.length : 0,
          users: Array.isArray(usersRes.data) ? usersRes.data.length : 0,
          companies: Array.isArray(companiesRes.data?.companies) ? companiesRes.data.companies.length : 0,
          projects: Array.isArray(projectsRes.data?.projects) ? projectsRes.data.projects.length : 0,
        });
      } catch (exc) {
        if (!active) return;
        setError("Unable to load SuperAdmin summary. Please refresh the page.");
      } finally {
        if (active) {
          setLoadingStats(false);
        }
      }
    };

    loadStats();

    return () => {
      active = false;
    };
  }, []);

  return (
    <StandardPageLayout
      title="SuperAdmin Console"
      subtitle="Centralized access for tenant administration, platform configuration, and global monitoring."
      eyebrow="SuperAdmin Overview"
      icon="shield"
      actions={
        <Link href={ROUTES.PLATFORM_HOME} className="erp-action-btn erp-action-btn-primary">
          Open Platform Home
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Active Tenants", value: stats.tenants, description: "Tenant records across the platform.", highlight: "bg-sky-50 text-sky-900" },
            { label: "Companies", value: stats.companies, description: "Managed companies and tenant bindings.", highlight: "bg-violet-50 text-violet-900" },
            { label: "Users", value: stats.users, description: "Users with access across tenants.", highlight: "bg-emerald-50 text-emerald-900" },
            { label: "Projects", value: stats.projects, description: "Configured projects across all tenants.", highlight: "bg-amber-50 text-amber-900" },
          ].map((item) => (
            <Card key={item.label} className="overflow-hidden">
              <CardContent className="space-y-2">
                <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {item.label}
                </div>
                <div className={`text-3xl font-semibold ${item.highlight}`}>{loadingStats ? "—" : item.value}</div>
                <p className="text-sm text-slate-500">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Platform control panel</CardTitle>
              <CardDescription>
                Access tenant lifecycle, user roles, platform settings, audit trails, and health metrics from one place.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Tenants", href: ROUTES.PLATFORM_TENANTS },
                { label: "Users", href: ROUTES.PLATFORM_USERS },
                { label: "Roles", href: ROUTES.PLATFORM_ROLES },
                { label: "Feature Flags", href: ROUTES.PLATFORM_FEATURE_FLAGS },
                { label: "Audit Logs", href: ROUTES.AUDIT_LOGS },
                { label: "System Health", href: ROUTES.PLATFORM_SYSTEM_HEALTH },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {item.label}
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
              <CardDescription>Jump directly to platform workflows and tenant administration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={ROUTES.PLATFORM_TENANTS} className="erp-action-btn erp-action-btn-primary w-full">
                Manage tenants
              </Link>
              <Link href={ROUTES.PLATFORM_USERS} className="erp-action-btn erp-action-btn-primary w-full">
                Review users
              </Link>
              <Link href={ROUTES.PLATFORM_COMPANIES} className="erp-action-btn erp-action-btn-primary w-full">
                Company directory
              </Link>
            </CardContent>
          </Card>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </div>
        ) : null}
      </div>
    </StandardPageLayout>
  );
}
