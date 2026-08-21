"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ERPFormGrid, ERPFormField } from "@/components/ui/erp-form-grid";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlatformGlobalPageShell, type KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { erpButtonClassName } from "@/components/erp/erpStyles";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { platformApi } from "@/services/modules/platform";
import { Building2, Plus, Power } from "lucide-react";
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
      const mapped: TenantItem[] = dataList.map((item: Record<string, unknown>) => ({
        id: String(item.id || item.tenantId || ""),
        name: String(item.name || item.companyName || "Unnamed Tenant"),
        subdomain: String(item.subdomain || "default"),
        adminEmail: String(item.adminEmail || item.ownerEmail || "admin@system.local"),
        adminName: String(item.adminName || item.ownerName || "Admin"),
        subscriptionPlan: String(item.subscriptionPlan || item.planTier || "Enterprise"),
        isActive: typeof item.isActive === "boolean" ? item.isActive : item.status === "active",
        status: item.isActive === false || item.status === "suspended" ? "suspended" : "active",
        createdAt: String(item.createdAt || new Date().toISOString()),
      }));
      setTenants(mapped);
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : "Failed to load tenant registry");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const activeCount = useMemo(() => tenants.filter((t) => t.isActive).length, [tenants]);
  const suspendedCount = useMemo(() => tenants.filter((t) => !t.isActive).length, [tenants]);

  const kpiMetrics: KpiMetricItem[] = [
    { label: "Total tenants", value: tenants.length, subtext: "Registered" },
    { label: "Active", value: activeCount, subtext: "Operational", tone: "positive" },
    { label: "Suspended", value: suspendedCount, subtext: "Blocked", tone: suspendedCount > 0 ? "warning" : "neutral" },
  ];

  const handleToggleStatus = async (tenant: TenantItem) => {
    const nextStatus = !tenant.isActive;
    const actionText = nextStatus ? "activate" : "suspend";
    const isConfirmed = await confirm({
      title: `${nextStatus ? "Activate" : "Suspend"} tenant`,
      message: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} "${tenant.name}" (${tenant.subdomain})? Users in this tenant will ${nextStatus ? "regain access" : "be blocked"}.`,
      confirmText: nextStatus ? "Activate" : "Suspend",
      variant: nextStatus ? "primary" : "danger",
    });

    if (!isConfirmed) return;

    try {
      await platformApi.superadmin.updateStatus(tenant.id, nextStatus, nextStatus ? "active" : "suspended");
      notifySuccess(`Tenant "${tenant.name}" has been ${actionText}d.`);
      void fetchTenants();
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : `Failed to ${actionText} tenant.`);
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

      notifySuccess(`Tenant "${form.name}" provisioned successfully.`);
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
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : "Failed to provision tenant");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<TenantItem>[] = [
    {
      accessorKey: "name",
      header: "Organization",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
            <Building2 className="h-4 w-4" />
          </span>
          <div>
            <span className="block font-semibold text-slate-900">{row.original.name}</span>
            <span className="font-mono text-xs text-slate-500">{row.original.subdomain}.uabindia.local</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "adminEmail",
      header: "Default admin",
      cell: ({ row }) => (
        <div>
          <span className="block font-medium text-slate-900">{row.original.adminName || "Tenant Admin"}</span>
          <span className="text-xs text-slate-500">{row.original.adminEmail}</span>
        </div>
      ),
    },
    {
      accessorKey: "subscriptionPlan",
      header: "Plan",
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium capitalize text-slate-700">
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
      header: "",
      cell: ({ row }) => (
        <button
          type="button"
          className={erpButtonClassName.secondary + " !h-8 !px-3 !text-xs"}
          onClick={() => void handleToggleStatus(row.original)}
        >
          <Power className={`h-3.5 w-3.5 ${row.original.isActive ? "text-rose-600" : "text-emerald-600"}`} />
          {row.original.isActive ? "Suspend" : "Activate"}
        </button>
      ),
    },
  ];

  return (
    <>
      <PlatformGlobalPageShell
        title="Tenant registry"
        subtitle="Provision and manage isolated tenant organizations across the platform."
        categoryTag="Platform / Tenants"
        kpiMetrics={kpiMetrics}
        searchPlaceholder="Search tenants…"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={() => void fetchTenants()}
        isLoading={isLoading}
        primaryActionLabel="Provision tenant"
        primaryActionIcon={<Plus className="h-4 w-4" />}
        onPrimaryAction={() => setIsDrawerOpen(true)}
        totalRecords={tenants.length}
      >
        <DataTable
          columns={columns}
          data={tenants}
          isLoading={isLoading}
          striped
          enableFiltering={false}
        />
      </PlatformGlobalPageShell>

      <SideDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Provision tenant"
        subtitle="Create a tenant schema and default admin account"
      >
        <form onSubmit={handleCreateTenant} className="space-y-5 p-1">
          <ERPFormGrid columns={1} title="Organization">
            <ERPFormField label="Company / tenant name" required>
              <Input
                placeholder="Acme Enterprise Pvt Ltd"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </ERPFormField>

            <ERPFormField label="Subdomain" required helperText="Unique handle (e.g. acme → acme.uabindia.local)">
              <Input
                placeholder="acme"
                value={form.subdomain}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  }))
                }
                required
              />
            </ERPFormField>

            <ERPFormField label="Subscription plan">
              <Select value={form.subscriptionPlan} onValueChange={(val) => setForm((prev) => ({ ...prev, subscriptionPlan: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Growth">Growth</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </ERPFormField>
          </ERPFormGrid>

          <ERPFormGrid columns={1} title="Default admin">
            <ERPFormField label="Admin full name" required>
              <Input
                placeholder="John Doe"
                value={form.adminName}
                onChange={(e) => setForm((prev) => ({ ...prev, adminName: e.target.value }))}
                required
              />
            </ERPFormField>

            <ERPFormField label="Admin email" required>
              <Input
                type="email"
                placeholder="admin@acme.com"
                value={form.adminEmail}
                onChange={(e) => setForm((prev) => ({ ...prev, adminEmail: e.target.value }))}
                required
              />
            </ERPFormField>

            <ERPFormField label="Initial password" helperText="Defaults to Admin@123456 if empty">
              <Input
                type="password"
                placeholder="••••••••"
                value={form.adminPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, adminPassword: e.target.value }))}
              />
            </ERPFormField>
          </ERPFormGrid>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <button type="submit" disabled={submitting} className={erpButtonClassName.primary}>
              {submitting ? "Provisioning…" : "Provision tenant"}
            </button>
          </div>
        </form>
      </SideDrawer>

      {confirmDialog}
    </>
  );
}

export default SuperadminTenantsManager;
