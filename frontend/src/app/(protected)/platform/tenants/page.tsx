"use client";

import { useRouter } from "next/navigation";
import { TenantListTable } from "@/features/tenants/components/TenantListTable";
import { Plus, Layers, ShieldCheck, Clock, ShieldAlert } from "lucide-react";
import { useTenants } from "@/features/tenants/hooks/useTenants";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";

export default function TenantsPage() {
  const router = useRouter();
  const { data } = useTenants({ limit: 500 });
  const tenants = data?.data || [];

  const total = data?.totalCount ?? tenants.length;
  const active = tenants.filter((t) => t.status === "active" && !t.isDeleted).length;
  const trialing = tenants.filter((t) => t.status === "trial").length;
  const suspended = tenants.filter((t) => t.status === "suspended").length;

  const kpis: KpiMetricItem[] = [
    { label: "Total Provisioned Tenants", value: total, tone: "info", icon: <Layers className="h-3.5 w-3.5" />, subtext: "Multi-Tenant" },
    { label: "Active Subscriptions", value: active, tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Production" },
    { label: "Trial Period", value: trialing, tone: "warning", icon: <Clock className="h-3.5 w-3.5" />, subtext: "Trialing" },
    { label: "Suspended / Billing", value: suspended, tone: "negative", icon: <ShieldAlert className="h-3.5 w-3.5" />, subtext: "Locked" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Tenant Management & Subdomain Provisioning"
      subtitle="Provision, manage, and monitor multi-tenant SaaS workspace instances, database isolation, and plan limits."
      categoryTag="Multi-Tenant Platform Operations"
      kpiMetrics={kpis}
      primaryActionLabel="Provision Tenant"
      onPrimaryAction={() => router.push("/platform/tenants/create")}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
    >
      <div className="p-4">
        <TenantListTable />
      </div>
    </PlatformGlobalPageShell>
  );
}
