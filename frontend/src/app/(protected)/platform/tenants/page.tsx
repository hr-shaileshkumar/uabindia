"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/design-system";
import { TenantListTable } from "@/features/tenants/components/TenantListTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTenants } from "@/features/tenants/hooks/useTenants";

export default function TenantsPage() {
  const router = useRouter();
  const { data } = useTenants({ limit: 500 });
  const tenants = data?.data || [];

  const total = data?.totalCount ?? tenants.length;
  const active = tenants.filter((t) => t.status === "active" && !t.isDeleted).length;
  const trialing = tenants.filter((t) => t.status === "trial").length;
  const suspended = tenants.filter((t) => t.status === "suspended").length;

  return (
    <div className="erp-page space-y-5">
      <PageHeader
        title="Tenant Management"
        subtitle="Provision, manage, and monitor SaaS tenants, subdomains, subscription plans, and billing status."
        eyebrow="Platform Operations"
        icon="globe"
        stats={[
          { label: "Total Tenants", value: total },
          { label: "Active", value: active, tone: "success" },
          { label: "Trialing", value: trialing, tone: "warning" },
          { label: "Suspended", value: suspended, tone: "danger" },
        ]}
        actions={
          <Button
            onClick={() => router.push("/platform/tenants/create")}
            className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 shadow-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Provision Tenant
          </Button>
        }
      />

      <div className="mt-4">
        <TenantListTable />
      </div>
    </div>
  );
}
