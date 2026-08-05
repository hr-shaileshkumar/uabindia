"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { PageHeader } from "@/design-system";
import { PERMISSIONS } from "@/constants/permissions";
import { hrApi } from "@/services/hrApi";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import AdminButton from "@/components/admin/AdminButton";
import AdminModal from "@/components/admin/AdminModal";
import AdminFormField from "@/components/admin/AdminFormField";
import AdminTableShell from "@/components/admin/AdminTableShell";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { useUiSchema } from "@/context/UiSchemaContext";

interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
  description?: string;
}

const BUSINESS_MODULE_KEYS = [
  "administration",
  "hrms",
  "payroll",
  "finance",
  "inventory",
  "procurement",
  "sales",
  "crm",
  "helpdesk",
  "communication",
  "integrations",
  "reports",
  "licensing",
  "security",
] as const;

const businessModuleSet = new Set<string>(BUSINESS_MODULE_KEYS);

const labelForModule = (moduleKey: string, displayName?: string) => {
  if (moduleKey.toLowerCase() === "erp") return "System shell";
  return displayName || moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1);
};

export default function PermissionsPage() {
  const { confirm, confirmDialog } = useConfirmDialog();
  const { navigation, state: schemaState, usingCache } = useUiSchema();
  const [perms, setPerms] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [modFilter, setModFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [newModule, setNewModule] = useState("");
  const [newAction, setNewAction] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await hrApi.platform.permissions();
      setPerms(res.data.permissions || []);
      setErr(null);
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to load permissions");
      setErr(message);
      notifyError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (schemaState !== "ready") {
      setLoading(false);
      setPerms([]);
      setErr(null);
      return;
    }

    void load();
  }, [load, schemaState]);

  const moduleDisplayNames = useMemo(
    () => new Map(navigation.modules.map((module) => [module.key, module.displayName])),
    [navigation.modules],
  );

  const moduleCatalog = useMemo(() => {
    const navModules = BUSINESS_MODULE_KEYS.map((moduleKey, index) => {
      const matched = navigation.modules.find((module) => module.key === moduleKey);
      return {
        key: moduleKey,
        label: labelForModule(moduleKey, matched?.displayName),
        order: typeof matched?.sortOrder === "number" ? matched.sortOrder : index,
      };
    });

    const extraPermissionModules = Array.from(new Set(perms.map((permission) => permission.module)))
      .filter((moduleKey) => moduleKey.toLowerCase() !== "erp" && !businessModuleSet.has(moduleKey))
      .map((moduleKey, index) => ({
        key: moduleKey,
        label: labelForModule(moduleKey, moduleDisplayNames.get(moduleKey)),
        order: navModules.length + index,
      }));

    return [...navModules, ...extraPermissionModules].sort((left, right) => left.order - right.order || left.label.localeCompare(right.label));
  }, [moduleDisplayNames, navigation.modules, perms]);

  const erpPresent = perms.some((permission) => permission.module.toLowerCase() === "erp");

  const modules = useMemo(() => {
    return ["all", ...moduleCatalog.map((module) => module.key), ...(erpPresent ? ["erp"] : [])];
  }, [erpPresent, moduleCatalog]);

  const visible = useMemo(() => {
    const q = filter.toLowerCase();
    return perms.filter((permission) => {
      const matchSearch =
        !q ||
        permission.module.toLowerCase().includes(q) ||
        permission.action.toLowerCase().includes(q) ||
        permission.name.toLowerCase().includes(q) ||
        (permission.description ?? "").toLowerCase().includes(q);
      const matchMod = modFilter === "all" || permission.module === modFilter;
      return matchSearch && matchMod;
    });
  }, [filter, modFilter, perms]);

  const handleCreate = async () => {
    setErr(null);
    if (!newModule.trim() || !newAction.trim()) {
      const message = "Module and Action are required.";
      setErr(message);
      notifyError(message);
      return;
    }

    const ok = await confirm({
      title: "Create permission",
      message: `Create permission \"${newModule.trim()}.${newAction.trim()}\"?`,
      confirmText: "Create",
    });
    if (!ok) return;

    setSaving(true);
    try {
      await hrApi.platform.createPermission({
        module: newModule.trim(),
        action: newAction.trim(),
        description: newDesc.trim() || undefined,
      });
      setShowCreate(false);
      setNewModule("");
      setNewAction("");
      setNewDesc("");
      notifySuccess("Permission created successfully.");
      await load();
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to create permission.");
      setErr(message);
      notifyError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: "Delete permission",
      message: `Delete permission \"${name}\"? It will move to deleted records and be removed from assigned roles.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await hrApi.platform.deletePermission(id);
      notifySuccess("Permission deleted successfully.");
      await load();
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to delete permission.");
      setErr(message);
      notifyError(message);
    }
  };

  const grouped: Record<string, Permission[]> = {};
  for (const moduleEntry of moduleCatalog) grouped[moduleEntry.key] = [];
  if (erpPresent) grouped.erp = [];
  for (const permission of visible) {
    if (!grouped[permission.module]) grouped[permission.module] = [];
    grouped[permission.module].push(permission);
  }

  return (
    <ProtectedRoute permission={PERMISSIONS.PLATFORM_PERMISSIONS_VIEW}>
      <div className="erp-page space-y-5">
        <PageHeader
          title="Permissions Catalog"
          subtitle="All permission definitions, grouped by module. The ERP system shell is shown separately from business modules."
          eyebrow="Administration / Access Control"
          icon="key"
          stats={[
            { label: "Permissions", value: perms.length },
            { label: "Visible", value: visible.length, tone: "success" },
            { label: "Distinct Actions", value: new Set(perms.map((p) => p.action)).size, tone: "info" },
          ]}
          actions={<AdminButton onClick={() => setShowCreate(true)}>Add Permission</AdminButton>}
        />
        
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="erp-label">Module</label>
              <select value={modFilter} onChange={(e) => setModFilter(e.target.value)} className="erp-select">
                {modules.map((module) => (
                  <option key={module} value={module}>
                    {module === "all" ? "All modules" : labelForModule(module, moduleDisplayNames.get(module))}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="erp-label">Search</label>
              <input
                type="text"
                placeholder="Search module, action, name, description..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="erp-input"
              />
            </div>
          </div>
        </div>
        {confirmDialog}

        <div className="erp-kpi-grid mb-4">
          <div className="erp-kpi-card">
            <p className="erp-kpi-label">Total Permissions</p>
            <p className="erp-kpi-value">{perms.length}</p>
            <p className="erp-kpi-meta">All defined permissions</p>
          </div>
          <div className="erp-kpi-card erp-kpi-card-info">
            <p className="erp-kpi-label">Modules</p>
            <p className="erp-kpi-value">{schemaState === "ready" ? BUSINESS_MODULE_KEYS.length : "—"}</p>
            <p className="erp-kpi-meta">{schemaState === "ready" ? (usingCache ? "Cached backend schema" : "Live backend schema") : "Waiting for backend schema"}</p>
          </div>
          <div className="erp-kpi-card erp-kpi-card-success">
            <p className="erp-kpi-label">Visible</p>
            <p className="erp-kpi-value erp-kpi-value-success">{visible.length}</p>
            <p className="erp-kpi-meta">Matching current filter</p>
          </div>
          <div className="erp-kpi-card erp-kpi-card-warning">
            <p className="erp-kpi-label">Actions</p>
            <p className="erp-kpi-value">{new Set(perms.map((permission) => permission.action)).size}</p>
            <p className="erp-kpi-meta">Distinct action types</p>
          </div>
        </div>

        {err && <div className="erp-alert-error mb-4">{err}</div>}

        <div className="erp-panel mb-4">
          <div className="erp-table-toolbar">
            <div>
              <div className="erp-table-title">Permission catalog</div>
              <div className="erp-table-subtitle">{loading ? "Loading…" : `${visible.length} filtered / ${perms.length} total permissions`}</div>
            </div>
          </div>
        </div>

        <AdminModal
          open={showCreate}
          title="New Permission"
          onClose={() => {
            setShowCreate(false);
            setErr(null);
          }}
          footer={
            <div className="erp-kpi-action-footer">
              <AdminButton
                variant="secondary"
                onClick={() => {
                  setShowCreate(false);
                  setErr(null);
                }}
              >
                Cancel
              </AdminButton>
              <AdminButton onClick={handleCreate} disabled={saving}>
                {saving ? "Saving…" : "Create Permission"}
              </AdminButton>
            </div>
          }
        >
          {err && <p className="mb-3 text-sm text-red-600">{err}</p>}
          <div className="space-y-3">
            <AdminFormField label="Module" required>
              <input value={newModule} onChange={(e) => setNewModule(e.target.value)} placeholder="e.g. hrms" className="erp-input w-full" />
            </AdminFormField>
            <AdminFormField label="Action" required>
              <input value={newAction} onChange={(e) => setNewAction(e.target.value)} placeholder="e.g. access, create, delete" className="erp-input w-full" />
            </AdminFormField>
            <AdminFormField label="Description">
              <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Optional description" className="erp-input w-full" />
            </AdminFormField>
          </div>
        </AdminModal>

        {moduleCatalog.map((module) => (
          <div key={module.key} className="mb-4">
            <AdminTableShell
              title={`Module: ${module.label}`}
              subtitle={`${grouped[module.key].length} permission${grouped[module.key].length !== 1 ? "s" : ""}`}
              badge={loading ? "Loading..." : `${grouped[module.key].length} visible`}
            >
              {grouped[module.key].length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  No permissions have been defined for this module yet.
                </div>
              ) : (
                <table className="erp-table">
                  <thead className="erp-thead">
                    <tr>
                      <th className="erp-th">Name</th>
                      <th className="erp-th">Action</th>
                      <th className="erp-th">Description</th>
                      <th className="erp-th w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped[module.key].map((permission) => (
                      <tr key={permission.id} className="erp-tr">
                        <td className="erp-td">
                          <div className="erp-row-title font-mono text-xs">{permission.name}</div>
                        </td>
                        <td className="erp-td">
                          <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{permission.action}</span>
                        </td>
                        <td className="erp-td text-sm text-slate-600">{permission.description || "—"}</td>
                        <td className="erp-td">
                          <AdminButton variant="danger" onClick={() => void handleDelete(permission.id, permission.name)} className="h-8 px-3 text-xs">
                            Delete
                          </AdminButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </AdminTableShell>
          </div>
        ))}

        {erpPresent && (
          <div className="mb-4">
            <AdminTableShell title="Module: System shell" subtitle={`${grouped.erp.length} permission${grouped.erp.length !== 1 ? "s" : ""}`} badge={loading ? "Loading..." : `${grouped.erp.length} visible`}>
              {grouped.erp.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  No permissions have been defined for the system shell yet.
                </div>
              ) : (
                <table className="erp-table">
                  <thead className="erp-thead">
                    <tr>
                      <th className="erp-th">Name</th>
                      <th className="erp-th">Action</th>
                      <th className="erp-th">Description</th>
                      <th className="erp-th w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {grouped.erp.map((permission) => (
                      <tr key={permission.id} className="erp-tr">
                        <td className="erp-td">
                          <div className="erp-row-title font-mono text-xs">{permission.name}</div>
                        </td>
                        <td className="erp-td">
                          <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{permission.action}</span>
                        </td>
                        <td className="erp-td text-sm text-slate-600">{permission.description || "—"}</td>
                        <td className="erp-td">
                          <AdminButton variant="danger" onClick={() => void handleDelete(permission.id, permission.name)} className="h-8 px-3 text-xs">
                            Delete
                          </AdminButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </AdminTableShell>
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="erp-panel py-12 text-center text-slate-500">
            No permissions found. {perms.length === 0 ? "Restart the backend to trigger automatic seeding." : "Try clearing the filters."}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
