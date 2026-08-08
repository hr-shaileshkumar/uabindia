"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DataTable } from "@/components/ui/data-table";
import { KPICard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ERPFormGrid, ERPFormField } from "@/components/ui/erp-form-grid";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { platformApi } from "@/services/modules/platform";
import { Building2, Plus, Users, ShieldCheck, Activity, Search, RefreshCw, Power } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

export interface TenantItem {
  id: string;
  name: string;
  subdomain: string;
  adminEmail: string;
  adminName?: string;
  subscriptionPlan: string;
  isActive: boolean;
  status?: string;
  createdAt?: string;
}

export function SuperadminTenantsManager() {
  const { confirm, confirmDialog } = useConfirmDialog();
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    subdomain: "",
    adminEmail: "",
    adminName: "",
    adminPassword: "",
    subscriptionPlan: "Enterprise",
    status: "active",
  });

  const fetchTenants = async () => {
    try {
      setIsLoading(true);
      const res = await platformApi.superadmin.tenants(1, 100, searchTerm);
      const dataList = res.data?.data || res.data?.tenants || [];
      const mapped: TenantItem[] = dataList.map((item: any) => ({
        id: item.id || item.tenantId,
        name: item.name || item.companyName || "Unnamed Tenant",
        subdomain: item.subdomain || "default",
        adminEmail: item.adminEmail || item.ownerEmail || "admin@system.local",
        adminName: item.adminName || item.ownerName || "Admin",
        subscriptionPlan: item.subscriptionPlan || item.planTier || "Enterprise",
        isActive: item.isActive ?? (item.status === "active"),
        status: item.isActive ? "active" : "suspended",
        createdAt: item.createdAt || new Date().toISOString(),
      }));
      setTenants(mapped);
    } catch (err: any) {
      notifyError(err?.message || "Failed to load superadmin tenant registry");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchTenants();
  }, [searchTerm]);

  const activeCount = useMemo(() => tenants.filter((t) => t.isActive).length, [tenants]);
  const suspendedCount = useMemo(() => tenants.filter((t) => !t.isActive).length, [tenants]);

  const handleToggleStatus = async (tenant: TenantItem) => {
    const nextStatus = !tenant.isActive;
    const actionText = nextStatus ? "activate" : "suspend";
    const isConfirmed = await confirm({
      title: `${nextStatus ? "Activate" : "Suspend"} Tenant Organization`,
      message: `Are you sure you want to ${actionText} "${tenant.name}" (${tenant.subdomain})? Users in this tenant will ${nextStatus ? "regain access" : "be blocked"}.`,
      confirmText: nextStatus ? "Activate Tenant" : "Suspend Tenant",
      variant: nextStatus ? "primary" : "danger",
    });

    if (!isConfirmed) return;

    try {
      await platformApi.superadmin.updateStatus(tenant.id, nextStatus, nextStatus ? "active" : "suspended");
      notifySuccess(`Tenant "${tenant.name}" has been ${actionText}d successfully.`);
      void fetchTenants();
    } catch (err: any) {
      notifyError(err?.message || `Failed to ${actionText} tenant.`);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.subdomain || !form.adminEmail) {
      notifyError("Organization name, subdomain, and admin email are required.");
      return;
    }

    try {
      setSubmitting(true);
      await platformApi.superadmin.createTenant({
        name: form.name,
        subdomain: form.subdomain,
        adminEmail: form.adminEmail,
        adminName: form.adminName || `${form.name} Admin`,
        adminPassword: form.adminPassword || "Admin@123456",
        subscriptionPlan: form.subscriptionPlan,
        status: form.status,
        selectedModules: ["platform", "hrms", "finance", "inventory"],
      });

      notifySuccess(`Tenant "${form.name}" provisioned successfully with default Admin!`);
      setIsDrawerOpen(false);
      setForm({
        name: "",
        subdomain: "",
        adminEmail: "",
        adminName: "",
        adminPassword: "",
        subscriptionPlan: "Enterprise",
        status: "active",
      });
      void fetchTenants();
    } catch (err: any) {
      notifyError(err?.message || "Failed to provision new tenant organization");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<TenantItem>[] = [
    {
      accessorKey: "name",
      header: "Organization Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-subtle)] text-[var(--primary)] shrink-0 font-bold text-xs">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-[var(--text-main)] block">{row.original.name}</span>
            <span className="text-3xs text-[var(--text-muted)] font-mono">{row.original.subdomain}.uabindia.local</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "adminEmail",
      header: "Default Admin",
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-[var(--text-main)] block">{row.original.adminName || "Tenant Admin"}</span>
          <span className="text-3xs text-[var(--text-muted)]">{row.original.adminEmail}</span>
        </div>
      ),
    },
    {
      accessorKey: "subscriptionPlan",
      header: "Plan Tier",
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-md bg-[var(--bg-muted)] px-2 py-1 text-2xs font-semibold text-[var(--text-main)] capitalize">
          {row.original.subscriptionPlan}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.isActive ? "active" : "failed"}
          label={row.original.isActive ? "Active" : "Suspended"}
        />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)]"
          onClick={() => handleToggleStatus(row.original)}
        >
          <Power className={`mr-1.5 h-3.5 w-3.5 ${row.original.isActive ? "text-[var(--danger)]" : "text-[var(--success)]"}`} />
          {row.original.isActive ? "Suspend" : "Activate"}
        </Button>
      ),
    },
  ];

  return (
    <AppShell
      title="Superadmin Tenant Provisioning & Registry"
      description="Global tenant administration, multi-tenant isolation control, plan assignments, and provisioning"
      breadcrumbs={[{ label: "Superadmin", href: "/superadmin/dashboard" }, { label: "Tenants" }]}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchTenants()} className="h-9 border-[var(--border-subtle)]">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsDrawerOpen(true)} className="h-9 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">
            <Plus className="mr-1.5 h-4 w-4" />
            Provision New Tenant
          </Button>
        </div>
      }
    >
      {/* Metric Cards Sweep */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <KPICard title="Total Onboarded Tenants" value={tenants.length} icon={<Building2 className="h-5 w-5" />} description="System-wide registered organizations" />
        <KPICard title="Active Organizations" value={activeCount} icon={<Activity className="h-5 w-5" />} trend={{ value: "100%", positive: true, label: "Operational" }} />
        <KPICard title="Suspended Organizations" value={suspendedCount} icon={<ShieldCheck className="h-5 w-5" />} trend={{ value: `${suspendedCount}`, neutral: true, label: "Blocked" }} />
      </div>

      {/* Main Tenant Table */}
      <DataTable
        title="Tenant Directory"
        description="All registered tenant organizations across the SaaS platform"
        columns={columns}
        data={tenants}
        isLoading={isLoading}
        striped
        enableFiltering
      />

      {/* Provisioning Drawer Modal */}
      <SideDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Provision New Tenant Organization"
        subtitle="Create a new isolated tenant schema + default Tenant Admin user account"
      >
        <form onSubmit={handleCreateTenant} className="space-y-5 p-1">
          <ERPFormGrid columns={1} title="Organization Details">
            <ERPFormField label="Company / Tenant Name" required>
              <Input
                placeholder="Acme Enterprise Pvt Ltd"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </ERPFormField>

            <ERPFormField label="Subdomain Handle" required helperText="Must be unique (e.g. acme => acme.uabindia.local)">
              <Input
                placeholder="acme"
                value={form.subdomain}
                onChange={(e) => setForm((prev) => ({ ...prev, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                required
              />
            </ERPFormField>

            <ERPFormField label="Subscription Plan Tier">
              <Select value={form.subscriptionPlan} onValueChange={(val) => setForm((prev) => ({ ...prev, subscriptionPlan: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter">Starter Plan</SelectItem>
                  <SelectItem value="Growth">Growth Plan</SelectItem>
                  <SelectItem value="Enterprise">Enterprise Plan</SelectItem>
                </SelectContent>
              </Select>
            </ERPFormField>
          </ERPFormGrid>

          <ERPFormGrid columns={1} title="Default Tenant Admin Account">
            <ERPFormField label="Admin Full Name" required>
              <Input
                placeholder="John Doe"
                value={form.adminName}
                onChange={(e) => setForm((prev) => ({ ...prev, adminName: e.target.value }))}
                required
              />
            </ERPFormField>

            <ERPFormField label="Admin Work Email" required>
              <Input
                type="email"
                placeholder="admin@acme.com"
                value={form.adminEmail}
                onChange={(e) => setForm((prev) => ({ ...prev, adminEmail: e.target.value }))}
                required
              />
            </ERPFormField>

            <ERPFormField label="Initial Password" helperText="Defaults to Admin@123456 if left empty">
              <Input
                type="password"
                placeholder="••••••••"
                value={form.adminPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, adminPassword: e.target.value }))}
              />
            </ERPFormField>
          </ERPFormGrid>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <Button variant="outline" type="button" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">
              {submitting ? "Provisioning..." : "Provision Tenant"}
            </Button>
          </div>
        </form>
      </SideDrawer>

      {confirmDialog}
    </AppShell>
  );
}

export default SuperadminTenantsManager;
