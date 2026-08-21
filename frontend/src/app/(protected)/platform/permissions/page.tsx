"use client";

import React, { useMemo, useState } from "react";
import { ShieldCheck, Plus, Eye, Key, Lock, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  parsePermissionKey,
  usePermissionMutations,
  usePlatformPermissions,
} from "@/features/platform/hooks/usePlatformPermissions";
import type { PermissionRecord } from "@/types";

type PermissionRow = PermissionRecord & { scope: "Global" | "Tenant" | "Company" };

const inferScope = (permission: PermissionRecord): PermissionRow["scope"] => {
  if (permission.module === "platform" && permission.action.includes("super")) {
    return "Global";
  }
  return "Tenant";
};

export default function PermissionsPage() {
  const { data = [], isLoading, isError, error, refetch } = usePlatformPermissions();
  const { createPermission } = usePermissionMutations();

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPerm, setSelectedPerm] = useState<PermissionRow | null>(null);
  const [permKey, setPermKey] = useState("");
  const [moduleName, setModuleName] = useState("platform");
  const [desc, setDesc] = useState("");

  const permissions = useMemo(
    () => data.map((permission) => ({ ...permission, scope: inferScope(permission) })),
    [data]
  );

  const handleCreatePerm = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parsePermissionKey(permKey) ?? {
      module: moduleName.trim().toLowerCase(),
      action: permKey.trim().toLowerCase(),
    };

    if (!parsed.module || !parsed.action) {
      notifyError("Use module.action format, e.g. finance.invoice.approve.");
      return;
    }

    try {
      await createPermission.mutateAsync({
        module: parsed.module,
        action: parsed.action,
        name: permKey.trim().toLowerCase(),
        description: desc.trim() || undefined,
      });
      setIsDrawerOpen(false);
      setPermKey("");
      setDesc("");
      notifySuccess(`Permission "${parsed.module}.${parsed.action}" created.`);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create permission."));
    }
  };

  const filteredPermissions = useMemo(() => {
    return permissions.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.module.toLowerCase().includes(q) ||
        p.action.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));
      const matchesModule = moduleFilter === "all" || p.module.toLowerCase() === moduleFilter.toLowerCase();
      return matchesSearch && matchesModule;
    });
  }, [permissions, search, moduleFilter]);

  const kpis: KpiMetricItem[] = [
    { label: "Total Permission Keys", value: permissions.length, tone: "info", icon: <Key className="h-3.5 w-3.5" />, subtext: "Live API" },
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
      onRefresh={() => void refetch()}
      isLoading={isLoading}
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
            <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capability Key:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedPerm.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Module:</span>
                <span className="font-bold">{selectedPerm.module}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Action:</span>
                <span className="font-semibold">{selectedPerm.action}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Description:</span>
                <p>{selectedPerm.description || "—"}</p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedPerm(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => void handleCreatePerm(e)} className="space-y-4 text-xs">
            <div className="space-y-2">
              <Label className="text-xs">Capability Key Name *</Label>
              <Input placeholder="finance.invoice.approve" value={permKey} onChange={(e) => setPermKey(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Module (fallback if key has no dot)</Label>
              <Input placeholder="platform" value={moduleName} onChange={(e) => setModuleName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Input placeholder="Allows approving customer invoices above limit" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-6">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createPermission.isPending}>
                {createPermission.isPending ? "Creating…" : "Create Permission"}
              </Button>
            </div>
          </form>
        )
      }
    >
      {isError && (
        <p className="px-4 py-3 text-xs text-rose-600 border-b border-[var(--border-subtle)]">
          {getApiErrorMessage(error, "Failed to load permissions.")}
        </p>
      )}
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Capability Policy Key</th>
              <th className="erp-th">Module</th>
              <th className="erp-th">Action</th>
              <th className="erp-th">Description</th>
              <th className="erp-th text-right">Inspect</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="erp-td text-center text-xs text-muted-foreground py-8">
                  Loading permissions…
                </td>
              </tr>
            ) : filteredPermissions.length === 0 ? (
              <tr>
                <td colSpan={5} className="erp-td text-center text-xs text-muted-foreground py-8">
                  No permissions found.
                </td>
              </tr>
            ) : (
              filteredPermissions.map((perm) => (
                <tr key={perm.id} className="erp-tr hover:bg-[var(--bg-muted)]/60 transition-colors">
                  <td className="erp-td font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                    <span className="inline-flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-slate-500" />
                      {perm.name}
                    </span>
                  </td>
                  <td className="erp-td">
                    <Badge variant="outline" className="text-xs font-normal">
                      {perm.module}
                    </Badge>
                  </td>
                  <td className="erp-td text-xs">{perm.action}</td>
                  <td className="erp-td text-xs text-muted-foreground">{perm.description || "—"}</td>
                  <td className="erp-td text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPerm(perm)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
