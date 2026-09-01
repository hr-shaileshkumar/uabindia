"use client";

import React, { useState } from "react";
import { useTenant } from "@/features/tenants/hooks/useTenants";
import { TenantHeader } from "@/features/tenants/components/ui/TenantHeader";
import { TenantProfileCard } from "@/features/tenants/components/cards/TenantProfileCard";
import { TenantStatsCard } from "@/features/tenants/components/cards/TenantStatsCard";
import { TenantModuleCard } from "@/features/tenants/components/cards/TenantModuleCard";
import { TenantStorageCard } from "@/features/tenants/components/cards/TenantStorageCard";
import { SubscriptionCard } from "@/features/tenants/components/cards/SubscriptionCard";
import { DomainCard } from "@/features/tenants/components/cards/DomainCard";
import { TenantTimeline } from "@/features/tenants/components/feed/TenantTimeline";
import { TenantActivity } from "@/features/tenants/components/feed/TenantActivity";
import { TenantEditDrawer } from "@/features/tenants/components/dialogs/TenantEditDrawer";
import { Users, Building2, Package, Activity, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { erpButtonClassName } from "@/components/workspace/styles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TenantProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  // Unwrap params using React.use for Next.js 15 compatibility
  const unwrappedParams = React.use(params);
  const { data: tenant, isLoading, error, refetch } = useTenant(unwrappedParams.id);

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading tenant details...</div>;
  }

  if (error || !tenant) {
    return <div className="p-8 text-center text-red-500">Failed to load tenant.</div>;
  }

  const mappedTenant = {
    id: tenant.id,
    name: tenant.name,
    subdomain: tenant.subdomain,
    status: tenant.status,
    adminName: tenant.adminName,
    adminEmail: tenant.adminEmail,
    contactNumber: tenant.contactNumber || "Not provided",
    address: tenant.address || "No address on file",
    createdAt: new Date(tenant.createdAt).toLocaleDateString(),
    plan: tenant.subscriptionPlan,
  };

  const modules = (tenant.selectedModules || []).map((modKey) => ({
    id: modKey,
    name: modKey.toUpperCase(),
    status: "enabled" as const,
    description: `Access to the ${modKey} module`,
  }));

  return (
    <div className="space-y-6">
      <TenantHeader 
        id={mappedTenant.id}
        name={mappedTenant.name}
        subdomain={mappedTenant.subdomain}
        status={mappedTenant.status}
        logoUrl={tenant.logoUrl || undefined}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditDrawerOpen(true)} className="gap-1.5">
              <Edit2 className="h-4 w-4 text-slate-600" />
              Edit Tenant Properties
            </Button>
            <Button variant="outline">Suspend Account</Button>
            <button type="button" className={erpButtonClassName.primary}>Login as Tenant</button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TenantStatsCard title="Total Users" value={tenant.usersCount || 0} icon={Users} trend={{ value: 0, label: "current users" }} />
        <TenantStatsCard title="Storage Limit" value={`${tenant.storageLimitGb || 50} GB`} icon={Building2} />
        <TenantStatsCard title="Employee Limit" value={`${tenant.employeeLimit || 50}`} icon={Package} />
        <TenantStatsCard title="WhatsApp Integration" value={tenant.whatsAppIntegrationEnabled ? "Enabled" : "Disabled"} icon={Activity} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-8">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent overflow-x-auto">
          <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Overview</TabsTrigger>
          <TabsTrigger value="modules" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Modules</TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Billing & Limits</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <TenantProfileCard tenant={mappedTenant} />
              <DomainCard 
                subdomain={mappedTenant.subdomain} 
                customDomain={tenant.customDomain || undefined} 
                isVerified={!!tenant.customDomain} 
                sslStatus={tenant.customDomain ? "active" : "failed"} 
              />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <TenantActivity 
                activities={[
                  { id: "1", type: "system" as const, message: `Tenant account initialized.`, timestamp: mappedTenant.createdAt },
                  tenant.lastActivityAt ? { id: "2", type: "user" as const, message: "Last active user session recorded.", timestamp: new Date(tenant.lastActivityAt).toLocaleString() } : null
                ].filter((item): item is NonNullable<typeof item> => Boolean(item))} 
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="modules" className="mt-6 space-y-6">
          <TenantModuleCard modules={modules} />
          <div className="w-full md:w-1/2">
             <TenantTimeline 
              events={[
                { id: "1", title: "Tenant DB Initialized", date: mappedTenant.createdAt, status: "completed" },
                { id: "2", title: "Base Provisioning", date: mappedTenant.createdAt, status: "completed" },
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="billing" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SubscriptionCard 
              planName={mappedTenant.plan} 
              status={mappedTenant.status === "active" ? "active" : "canceled"} 
              billingCycle="monthly" 
              nextBillingDate={tenant.billingEndDate ? new Date(tenant.billingEndDate).toLocaleDateString() : "No end date"} 
            />
            <TenantStorageCard usedStorageGb={1.2} totalStorageGb={tenant.storageLimitGb || 50} />
          </div>
        </TabsContent>
      </Tabs>

      <TenantEditDrawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        tenant={tenant}
        onSuccess={refetch}
      />
    </div>
  );
}
