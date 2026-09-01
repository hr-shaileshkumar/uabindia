"use client";

import React, { useMemo, useState } from "react";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { ErpDrawerFooter, ErpRowActions } from "@/components/workspace/page-kit";
import { UniversalDeleteDialog } from "@/components/workspace/templates/UniversalDeleteDialog";
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
  const { createPermission, deletePermission } = usePermissionMutations();

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [permKey, setPermKey] = useState("");
  const [moduleName, setModuleName] = useState("platform");
  const [desc, setDesc] = useState("");

  const permissions = useMemo(
    () => data.map((permission) => ({ ...permission, scope: inferScope(permission) })),
    [data]
  );

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

  const closeDrawer = () => {
    setDrawerOpen(false);
    setPermKey("");
    setDesc("");
    setModuleName("platform");
  };

  const handleCreatePerm = async () => {
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
      closeDrawer();
      notifySuccess(`Permission "${parsed.module}.${parsed.action}" created.`);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create permission."));
    }
  };

  const kpis: KpiMetricItem[] = [
    { label: "Permission keys", value: permissions.length, tone: "info" },
    { label: "Modules", value: new Set(permissions.map((p) => p.module)).size, tone: "positive" },
    { label: "Global", value: permissions.filter((p) => p.scope === "Global").length, tone: "warning" },
    { label: "Tenant", value: permissions.filter((p) => p.scope === "Tenant").length, tone: "positive" },
  ];

  return (
    <>
      <PlatformGlobalPageShell
        title="Permissions"
        categoryTag="Platform"
        icon="shield"
        kpiMetrics={kpis}
        searchPlaceholder="Filter capability key, module, or description…"
        searchValue={search}
        onSearchChange={setSearch}
        filterOptions={[
          {
            key: "module",
            label: "Module",
            value: moduleFilter,
            onChange: setModuleFilter,
            options: [
              { label: "All modules", value: "all" },
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
        primaryActionLabel="New permission"
        onPrimaryAction={() => setDrawerOpen(true)}
        onRefresh={() => void refetch()}
        isLoading={isLoading}
        listKey="platform-permissions"
        listRows={filteredPermissions}
        getRowId={(row) => row.id}
        emptyMessage="No permissions found."
        listColumns={[
          { key: "name", label: "Capability key", dataType: "string" },
          { key: "module", label: "Module", dataType: "string" },
          { key: "action", label: "Action", dataType: "string" },
          { key: "description", label: "Description", dataType: "string" },
          { key: "actions", label: "Actions", locked: true },
        ]}
        renderListRow={(perm) => (
          <>
            <td className="erp-td font-mono text-xs font-semibold">{perm.name}</td>
            <td className="erp-td text-xs">{perm.module}</td>
            <td className="erp-td text-xs">{perm.action}</td>
            <td className="erp-td text-xs text-slate-500">{perm.description || "—"}</td>
            <td className="erp-td">
              <ErpRowActions onDelete={{ label: "Delete", onClick: () => setDeleteId(perm.id) }} />
            </td>
          </>
        )}
        isInspectorOpen={drawerOpen}
        onInspectorClose={closeDrawer}
        inspectorTitle="Create permission"
        inspectorContent={
          <div className="erp-form-grid">
            {isError ? (
              <p className="md:col-span-2 text-xs text-rose-600">{getApiErrorMessage(error, "Failed to load permissions.")}</p>
            ) : null}
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Capability key *</label>
              <input
                className="erp-input font-mono"
                placeholder="finance.invoice.approve"
                value={permKey}
                onChange={(e) => setPermKey(e.target.value)}
              />
            </div>
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Module (fallback if key has no dot)</label>
              <input className="erp-input" placeholder="platform" value={moduleName} onChange={(e) => setModuleName(e.target.value)} />
            </div>
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Description</label>
              <input
                className="erp-input"
                placeholder="Allows approving customer invoices above limit"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <ErpDrawerFooter
                onCancel={closeDrawer}
                onSave={() => void handleCreatePerm()}
                saving={createPermission.isPending}
                saveLabel="Create permission"
              />
            </div>
          </div>
        }
      />

      <UniversalDeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete permission"
        entityName={permissions.find((p) => p.id === deleteId)?.name}
        onConfirm={async () => {
          if (!deleteId) return;
          await deletePermission.mutateAsync(deleteId);
          notifySuccess("Permission deleted.");
          setDeleteId(null);
        }}
        loading={deletePermission.isPending}
      />
    </>
  );
}
