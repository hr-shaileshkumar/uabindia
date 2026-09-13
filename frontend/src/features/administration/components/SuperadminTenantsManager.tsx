"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdministrationGlobalPageShell, type KpiMetricItem } from "@/components/administration/AdministrationGlobalPageShell";
import { ErpDrawerFooter, ErpRowActions } from "@/components/workspace/page-kit";
import { erpButtonClassName } from "@/components/workspace/styles";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { platformApi } from "@/services/modules/administration";
import { Building2, Power, ExternalLink, ShieldCheck, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";

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

const emptyForm = () => ({
  name: "",
  subdomain: "",
  adminEmail: "",
  adminName: "",
  adminPassword: "",
  subscriptionPlan: "Enterprise",
  status: "active",
  customDomain: "",
});

export function SuperadminTenantsManager() {
  const { confirm, confirmDialog } = useConfirmDialog();
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [mode, setMode] = useState<"closed" | "create" | "edit">("closed");
  const [editing, setEditing] = useState<TenantItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const fetchTenants = async () => {
    try {
      setIsLoading(true);
      const res = await platformApi.superadmin.tenants(1, 100, search);
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
  }, [search]);

  const filteredTenants = useMemo(() => {
    const q = search.toLowerCase();
    return tenants.filter((t) => {
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.subdomain.toLowerCase().includes(q) ||
        t.adminEmail.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && t.isActive) ||
        (statusFilter === "suspended" && !t.isActive);
      const matchesPlan =
        planFilter === "all" || t.subscriptionPlan.toLowerCase() === planFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [tenants, search, statusFilter, planFilter]);

  const activeCount = useMemo(() => tenants.filter((t) => t.isActive).length, [tenants]);
  const suspendedCount = useMemo(() => tenants.filter((t) => !t.isActive).length, [tenants]);

  const kpis: KpiMetricItem[] = [
    { label: "Total tenants", value: tenants.length, subtext: "Registered cloud orgs", tone: "info", icon: <Building2 className="h-3.5 w-3.5" /> },
    { label: "Operational", value: activeCount, subtext: "Active workloads", tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    { label: "Suspended", value: suspendedCount, subtext: "Access restricted", tone: suspendedCount > 0 ? "warning" : "neutral", icon: <AlertCircle className="h-3.5 w-3.5" /> },
  ];

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setMode("create");
  };

  const openEdit = (tenant: TenantItem) => {
    setEditing(tenant);
    setForm({
      name: tenant.name,
      subdomain: tenant.subdomain,
      adminEmail: tenant.adminEmail,
      adminName: tenant.adminName || `${tenant.name} Admin`,
      adminPassword: "",
      subscriptionPlan: tenant.subscriptionPlan || "Enterprise",
      status: tenant.isActive ? "active" : "suspended",
      customDomain: "",
    });
    setMode("edit");
  };

  const handleToggleStatus = async (tenant: TenantItem) => {
    const nextStatus = !tenant.isActive;
    const actionText = nextStatus ? "activate" : "suspend";
    const isConfirmed = await confirm({
      title: `${nextStatus ? "Activate" : "Suspend"} tenant organization`,
      message: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} "${tenant.name}" (${tenant.subdomain})? Users in this tenant will ${nextStatus ? "regain access" : "be locked out"}.`,
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

  const handleDeleteTenant = async (tenant: TenantItem) => {
    const isConfirmed = await confirm({
      title: `Delete tenant "${tenant.name}"`,
      message: `Are you sure you want to permanently delete tenant organization "${tenant.name}" (${tenant.subdomain})? All data and accounts associated with this tenant will be removed.`,
      confirmText: "Delete Tenant",
      variant: "danger",
    });

    if (!isConfirmed) return;

    try {
      await platformApi.admin.deleteTenant(tenant.id);
      setTenants((prev) => prev.filter((t) => t.id !== tenant.id));
      notifySuccess(`Tenant "${tenant.name}" has been deleted.`);
      void fetchTenants();
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : "Failed to delete tenant.");
    }
  };

  const handleSaveTenant = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.name || !form.subdomain || !form.adminEmail) {
      notifyError("Organization name, subdomain, and admin email are required.");
      return;
    }

    try {
      setSubmitting(true);
      if (mode === "create") {
        await platformApi.superadmin.createTenant({
          name: form.name.trim(),
          subdomain: form.subdomain.trim().toLowerCase(),
          adminEmail: form.adminEmail.trim().toLowerCase(),
          adminName: form.adminName.trim() || `${form.name} Admin`,
          adminPassword: form.adminPassword || "Admin@123456",
          subscriptionPlan: form.subscriptionPlan,
          status: form.status,
          selectedModules: ["platform", "hrms", "finance", "inventory", "procurement", "crm", "projects"],
        });
        notifySuccess(`Tenant "${form.name}" provisioned successfully.`);
      } else if (mode === "edit" && editing) {
        await platformApi.superadmin.updateStatus(
          editing.id,
          form.status === "active",
          form.status
        );
        notifySuccess(`Tenant "${form.name}" updated successfully.`);
      }

      setMode("closed");
      void fetchTenants();
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : "Failed to save tenant organization");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AdministrationGlobalPageShell
        title="Tenant Organizations"
        subtitle="Provision, manage, and monitor all cloud tenant organizations in the UABIndia multi-tenant SaaS platform."
        categoryTag="Control Plane"
        icon="building"
        kpiMetrics={kpis}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter organization, subdomain, admin email…"
        onClearFilters={() => {
          setSearch("");
          setStatusFilter("all");
          setPlanFilter("all");
        }}
        filterOptions={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: (val) => setStatusFilter(val),
            options: [
              { label: "All status", value: "all" },
              { label: "Active", value: "active" },
              { label: "Suspended", value: "suspended" },
            ],
          },
          {
            key: "plan",
            label: "Plan",
            value: planFilter,
            onChange: (val) => setPlanFilter(val),
            options: [
              { label: "All plans", value: "all" },
              { label: "Enterprise", value: "enterprise" },
              { label: "Growth", value: "growth" },
              { label: "Starter", value: "starter" },
              { label: "Trial", value: "trial" },
            ],
          },
        ]}
        primaryActionLabel="Provision tenant"
        onPrimaryAction={openCreate}
        onRefresh={() => void fetchTenants()}
        isLoading={isLoading}
        listKey="platform-tenants"
        listRows={filteredTenants}
        getRowId={(row) => row.id}
        emptyMessage="No tenants registered yet. Provision a new tenant organization to get started."
        listColumns={[
          { key: "name", label: "Organization", dataType: "string" },
          { key: "subdomain", label: "Subdomain", dataType: "string" },
          { key: "adminEmail", label: "Default Admin", dataType: "string" },
          { key: "subscriptionPlan", label: "Plan Tier", dataType: "string" },
          { key: "isActive", label: "Status", dataType: "boolean" },
          { key: "actions", label: "Actions", locked: true },
        ]}
        renderListRow={(tenant) => (
          <tr key={tenant.id} className="erp-tr">
            <td className="erp-td">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm">
                  {tenant.name.charAt(0).toUpperCase() || "T"}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{tenant.name}</div>
                  <div className="font-mono text-xs text-slate-400">{tenant.id.slice(0, 8)}…</div>
                </div>
              </div>
            </td>
            <td className="erp-td">
              <span className="font-mono text-xs text-indigo-600 font-medium">{tenant.subdomain}.uabindia.in</span>
            </td>
            <td className="erp-td">
              <div className="text-xs font-medium text-slate-900">{tenant.adminName || "Tenant Admin"}</div>
              <div className="text-xs text-slate-500">{tenant.adminEmail}</div>
            </td>
            <td className="erp-td">
              <span className={`erp-chip ${
                tenant.subscriptionPlan?.toLowerCase() === 'enterprise' ? 'erp-chip-info' :
                tenant.subscriptionPlan?.toLowerCase() === 'growth' ? 'erp-chip-success' :
                tenant.subscriptionPlan?.toLowerCase() === 'trial' ? 'erp-chip-warning' :
                'erp-chip-neutral'
              }`}>
                {tenant.subscriptionPlan}
              </span>
            </td>
            <td className="erp-td">
              <span className={tenant.isActive ? "erp-chip erp-chip-success" : "erp-chip erp-chip-danger"}>
                {tenant.isActive ? "Active" : "Suspended"}
              </span>
            </td>
            <td className="erp-td text-right">
              <div className="flex items-center justify-end gap-1.5">
                <Link
                  href={`/platform/tenants/${tenant.id}/edit`}
                  className="inline-flex h-7 items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Configure
                </Link>
                <button
                  type="button"
                  className={`inline-flex h-7 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                    tenant.isActive
                      ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                  onClick={() => void handleToggleStatus(tenant)}
                >
                  <Power className="h-3 w-3" />
                  {tenant.isActive ? "Suspend" : "Activate"}
                </button>
                <button
                  type="button"
                  title="Delete Tenant"
                  className="inline-flex h-7 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  onClick={() => void handleDeleteTenant(tenant)}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </td>
          </tr>
        )}
        isInspectorOpen={mode !== "closed"}
        onInspectorClose={() => setMode("closed")}
        inspectorTitle={mode === "edit" ? "Edit tenant organization" : "Provision tenant organization"}
        inspectorContent={
          <div className="erp-form-grid">
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Organization name *</label>
              <input
                className="erp-input"
                placeholder="e.g. Acme Enterprise Pvt Ltd"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div className="erp-field">
              <label className="erp-label">Subdomain handle *</label>
              <input
                className="erp-input font-mono"
                placeholder="acme"
                value={form.subdomain}
                disabled={mode === "edit"}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  }))
                }
                required
              />
              <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                {form.subdomain ? `${form.subdomain}.uabindia.in` : "handle.uabindia.in"}
              </span>
            </div>

            <div className="erp-field">
              <label className="erp-label">Subscription tier</label>
              <select
                className="erp-select capitalize"
                value={form.subscriptionPlan}
                onChange={(e) => setForm((f) => ({ ...f, subscriptionPlan: e.target.value }))}
              >
                <SelectItemOption value="Trial">Trial (14 Days)</SelectItemOption>
                <SelectItemOption value="Starter">Starter (Up to 50 Users)</SelectItemOption>
                <SelectItemOption value="Growth">Growth (Up to 250 Users)</SelectItemOption>
                <SelectItemOption value="Enterprise">Enterprise (Unlimited + Dedicated Support)</SelectItemOption>
              </select>
            </div>

            <div className="erp-field">
              <label className="erp-label">Default admin full name *</label>
              <input
                className="erp-input"
                placeholder="e.g. Rajesh Sharma"
                value={form.adminName}
                onChange={(e) => setForm((f) => ({ ...f, adminName: e.target.value }))}
                required
              />
            </div>

            <div className="erp-field">
              <label className="erp-label">Default admin work email *</label>
              <input
                className="erp-input"
                type="email"
                placeholder="admin@acme.com"
                value={form.adminEmail}
                onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))}
                required
              />
            </div>

            {mode === "create" && (
              <div className="erp-field md:col-span-2">
                <label className="erp-label">Initial admin password</label>
                <input
                  className="erp-input"
                  type="password"
                  placeholder="Defaults to Admin@123456 if left empty"
                  value={form.adminPassword}
                  onChange={(e) => setForm((f) => ({ ...f, adminPassword: e.target.value }))}
                />
              </div>
            )}

            <div className="erp-field md:col-span-2">
              <label className="erp-label">Operational status</label>
              <select
                className="erp-select"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <SelectItemOption value="active">Active (Operational)</SelectItemOption>
                <SelectItemOption value="suspended">Suspended (Locked)</SelectItemOption>
              </select>
            </div>

            <div className="md:col-span-2 pt-3 border-t border-slate-100">
              <ErpDrawerFooter
                onCancel={() => setMode("closed")}
                onSave={() => void handleSaveTenant()}
                saving={submitting}
                isEdit={mode === "edit"}
              />
            </div>
          </div>
        }
      />

      {confirmDialog}
    </>
  );
}

function SelectItemOption({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>;
}

export default SuperadminTenantsManager;
