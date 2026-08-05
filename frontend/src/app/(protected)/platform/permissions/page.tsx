"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Plus, Eye, Key, Lock, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { hrApi } from "@/services/hrApi";
import { notifySuccess } from "@/lib/notifications";

interface PermissionRow {
  id: string;
  name: string;
  module: string;
  description?: string;
  scope?: "Global" | "Tenant" | "Company";
}

const SEED_PERMISSIONS: PermissionRow[] = [
  { id: "p1", name: "platform.users.manage", module: "Platform", description: "Full user lifecycle management", scope: "Tenant" },
  { id: "p2", name: "platform.roles.manage", module: "Platform", description: "Role permission matrix modification", scope: "Tenant" },
  { id: "p3", name: "finance.journal.post", module: "Finance", description: "Post general ledger journal entries", scope: "Company" },
  { id: "p4", name: "hrms.payroll.execute", module: "HRMS", description: "Execute monthly payroll calculations", scope: "Company" },
  { id: "p5", name: "sales.order.approve", module: "Sales", description: "Approve customer sales orders above limit", scope: "Company" },
  { id: "p6", name: "inventory.stock.transfer", module: "Inventory", description: "Transfer stock between warehouses", scope: "Company" },
  { id: "p7", name: "platform.superadmin.all", module: "Platform", description: "SuperAdmin unrestricted system access", scope: "Global" },
];

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<PermissionRow[]>(SEED_PERMISSIONS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPerm, setSelectedPerm] = useState<PermissionRow | null>(null);

  // Form State
  const [permKey, setPermKey] = useState("");
  const [moduleName, setModuleName] = useState("Platform");
  const [desc, setDesc] = useState("");

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const res = await hrApi.platform.permissions();
      const list = (res.data as { permissions?: PermissionRow[] })?.permissions || (Array.isArray(res.data) ? res.data : []);
      if (list.length > 0) {
        setPermissions(list);
      }
    } catch {
      // Retain SEED_PERMISSIONS
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPermissions();
  }, []);

  const handleCreatePerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permKey.trim()) return;

    const newP: PermissionRow = {
      id: `p_${Date.now()}`,
      name: permKey.trim().toLowerCase(),
      module: moduleName,
      description: desc.trim() || "System policy capability key",
      scope: "Tenant",
    };

    setPermissions((prev) => [newP, ...prev]);
    setIsDrawerOpen(false);
    setPermKey("");
    setDesc("");
    notifySuccess(`Permission "${newP.name}" created successfully.`);
  };

  const filteredPermissions = useMemo(() => {
    return permissions.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
      const matchesModule = moduleFilter === "all" || p.module.toLowerCase() === moduleFilter.toLowerCase();
      return matchesSearch && matchesModule;
    });
  }, [permissions, search, moduleFilter]);

  const kpis: KpiMetricItem[] = [
    { label: "Total Permission Keys", value: permissions.length, tone: "info", icon: <Key className="h-3.5 w-3.5" />, subtext: "Configured" },
    { label: "Covered Modules", value: new Set(permissions.map((p) => p.module)).size, tone: "positive", icon: <Layers className="h-3.5 w-3.5" />, subtext: "Modules" },
    { label: "Global Policies", value: permissions.filter((p) => p.scope === "Global").length, tone: "warning", icon: <Lock className="h-3.5 w-3.5" />, subtext: "SuperAdmin" },
    { label: "Tenant Policies", value: permissions.filter((p) => p.scope === "Tenant").length, tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Multi-Tenant" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Permissions Catalog & Access Keys"
      subtitle="Granular capabilities and action policy keys mapped across ERP submodules."
      categoryTag="RBAC Governance"
      kpiMetrics={kpis}
      searchPlaceholder="Filter capability key, description, or module..."
      searchValue={search}
      onSearchChange={setSearch}
      filterOptions={[
        {
          key: "module",
          label: "All Modules",
          value: moduleFilter,
          onChange: setModuleFilter,
          options: [
            { label: "All Modules", value: "all" },
            { label: "Platform", value: "platform" },
            { label: "Finance", value: "finance" },
            { label: "HRMS", value: "hrms" },
            { label: "Sales", value: "sales" },
            { label: "Inventory", value: "inventory" },
          ],
        },
      ]}
      onClearFilters={() => {
        setSearch("");
        setModuleFilter("all");
      }}
      primaryActionLabel="New Permission Key"
      onPrimaryAction={() => setIsDrawerOpen(true)}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
      onRefresh={loadPermissions}
      isLoading={loading}
      isInspectorOpen={isDrawerOpen || !!selectedPerm}
      onInspectorClose={() => {
        setIsDrawerOpen(false);
        setSelectedPerm(null);
      }}
      inspectorTitle={selectedPerm ? `Permission Key: ${selectedPerm.name}` : "Create Permission Policy Key"}
      inspectorSubTitle={selectedPerm ? `Module ${selectedPerm.module}` : "Register a new capability key for RBAC enforcement."}
      inspectorContent={
        selectedPerm ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Capability Key:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedPerm.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Module:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedPerm.module}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scope:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedPerm.scope || "Tenant"}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Description:</span>
                <p className="text-slate-800 dark:text-slate-200">{selectedPerm.description}</p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedPerm(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreatePerm} className="space-y-4 text-xs">
            <div className="space-y-2">
              <Label className="text-xs">Capability Key Name *</Label>
              <Input placeholder="finance.invoice.approve" value={permKey} onChange={(e) => setPermKey(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Module Scope</Label>
              <Input placeholder="Platform / Finance / HRMS" value={moduleName} onChange={(e) => setModuleName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Input placeholder="Allows approving customer invoices above $10,000" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2 pt-6">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Create Permission
              </Button>
            </div>
          </form>
        )
      }
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Capability Policy Key</th>
              <th className="erp-th">Module</th>
              <th className="erp-th">Description</th>
              <th className="erp-th">Scope</th>
              <th className="erp-th text-right">Inspect</th>
            </tr>
          </thead>
          <tbody>
            {filteredPermissions.map((perm) => (
              <tr key={perm.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-indigo-500" />
                  {perm.name}
                </td>
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {perm.module}
                  </Badge>
                </td>
                <td className="erp-td text-xs text-slate-600 dark:text-slate-400">{perm.description || "-"}</td>
                <td className="erp-td">
                  <span className={perm.scope === "Global" ? "erp-chip erp-chip-danger" : "erp-chip erp-chip-info"}>
                    {perm.scope || "Tenant"}
                  </span>
                </td>
                <td className="erp-td text-right">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600" onClick={() => setSelectedPerm(perm)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
