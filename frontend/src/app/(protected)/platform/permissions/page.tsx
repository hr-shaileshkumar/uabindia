"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { PERMISSIONS } from "@/constants/permissions";
import { hrApi } from "@/services/hrApi";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import AdminButton from "@/components/admin/AdminButton";
import AdminModal from "@/components/admin/AdminModal";
import AdminFormField from "@/components/admin/AdminFormField";
import AdminTableShell from "@/components/admin/AdminTableShell";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";

interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
  description?: string;
}

const MODULE_COLORS: Record<string, string> = {
  platform:  "bg-violet-100 text-violet-700",
  security:  "bg-red-100 text-red-700",
  licensing: "bg-amber-100 text-amber-700",
  hrms:      "bg-green-100 text-green-700",
  payroll:   "bg-blue-100 text-blue-700",
  reports:   "bg-sky-100 text-sky-700",
  erp:       "bg-orange-100 text-orange-700",
};

function moduleBadge(module: string) {
  const cls = MODULE_COLORS[module] ?? "bg-slate-100 text-slate-600";
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${cls}`}>{module}</span>;
}

export default function PermissionsPage() {
  const { confirm, confirmDialog } = useConfirmDialog();
  const [perms, setPerms]       = useState<Permission[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("");
  const [modFilter, setModFilter] = useState("all");

  // create dialog state
  const [showCreate, setShowCreate] = useState(false);
  const [newModule, setNewModule]   = useState("");
  const [newAction, setNewAction]   = useState("");
  const [newDesc, setNewDesc]       = useState("");
  const [saving, setSaving]         = useState(false);
  const [err, setErr]               = useState<string | null>(null);

  const load = async () => {
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
  };

  useEffect(() => { load(); }, []);

  const modules = ["all", ...Array.from(new Set(perms.map((p) => p.module))).sort()];

  const visible = perms.filter((p) => {
    const q = filter.toLowerCase();
    const matchSearch =
      !q ||
      p.module.toLowerCase().includes(q) ||
      p.action.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      (p.description ?? "").toLowerCase().includes(q);
    const matchMod    = modFilter === "all" || p.module === modFilter;
    return matchSearch && matchMod;
  });

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
      await hrApi.platform.createPermission({ module: newModule.trim(), action: newAction.trim(), description: newDesc.trim() || undefined });
      setShowCreate(false); setNewModule(""); setNewAction(""); setNewDesc("");
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
      message: `Delete permission "${name}"? It will move to deleted records and be removed from assigned roles.`,
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

  // Group by module for display
  const grouped: Record<string, Permission[]> = {};
  for (const p of visible) {
    if (!grouped[p.module]) grouped[p.module] = [];
    grouped[p.module].push(p);
  }

  return (
    <ProtectedRoute permission={PERMISSIONS.PLATFORM_PERMISSIONS_VIEW}>
      <StandardPageLayout
        title="Permissions Catalog"
        subtitle="All permission definitions. Assign them to roles from the Roles page."
        eyebrow="Administration / Access Control"
        icon="key"
        actions={
          <AdminButton
            onClick={() => setShowCreate(true)}
          >
            Add Permission
          </AdminButton>
        }
        filters={
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="erp-label">Module</label>
              <select
                value={modFilter}
                onChange={(e) => setModFilter(e.target.value)}
                className="erp-select"
              >
                {modules.map((m) => <option key={m} value={m}>{m === "all" ? "All modules" : m}</option>)}
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
        }
      >
      {confirmDialog}

      {/* KPI summary cards */}
      <div className="erp-kpi-grid mb-4">
        <div className="erp-kpi-card"><p className="erp-kpi-label">Total Permissions</p><p className="erp-kpi-value">{perms.length}</p><p className="erp-kpi-meta">All defined permissions</p></div>
        <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Modules</p><p className="erp-kpi-value">{new Set(perms.map(p => p.module)).size}</p><p className="erp-kpi-meta">Unique access modules</p></div>
        <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Visible</p><p className="erp-kpi-value erp-kpi-value-success">{visible.length}</p><p className="erp-kpi-meta">Matching current filter</p></div>
        <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Actions</p><p className="erp-kpi-value">{new Set(perms.map(p => p.action)).size}</p><p className="erp-kpi-meta">Distinct action types</p></div>
      </div>

      {err && <div className="erp-alert-error mb-4">{err}</div>}

      <div className="erp-panel mb-4">
        <div className="erp-table-toolbar">
          <div>
            <div className="erp-table-title">Permission catalog</div>
            <div className="erp-table-subtitle">
              {loading ? "Loading…" : `${visible.length} filtered / ${perms.length} total permissions`}
            </div>
          </div>
        </div>
      </div>

      {/* Create dialog */}
      <AdminModal
        open={showCreate}
        title="New Permission"
        onClose={() => { setShowCreate(false); setErr(null); }}
        footer={
          <div className="erp-kpi-action-footer">
            <AdminButton variant="secondary" onClick={() => { setShowCreate(false); setErr(null); }}>
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

      {/* Table grouped by module */}
      {Object.keys(grouped).sort().map((mod) => (
        <div key={mod} className="mb-4">
          <AdminTableShell
            title={`Module: ${mod}`}
            subtitle={`${grouped[mod].length} permission${grouped[mod].length !== 1 ? "s" : ""}`}
            badge={loading ? "Loading..." : `${visible.length} visible`}
          >
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
                {grouped[mod].map((p) => (
                  <tr key={p.id} className="erp-tr">
                    <td className="erp-td">
                      <div className="erp-row-title font-mono text-xs">{p.name}</div>
                    </td>
                    <td className="erp-td">
                      <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {p.action}
                      </span>
                    </td>
                    <td className="erp-td text-slate-600 text-sm">{p.description || "—"}</td>
                    <td className="erp-td">
                      <AdminButton
                        variant="danger"
                        onClick={() => handleDelete(p.id, p.name)}
                        className="h-8 px-3 text-xs"
                      >
                        Delete
                      </AdminButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTableShell>
        </div>
      ))}

        {!loading && visible.length === 0 && (
          <div className="erp-panel py-12 text-center text-slate-500">
            No permissions found.{" "}
            {perms.length === 0 ? "Restart the backend to trigger automatic seeding." : "Try clearing the filters."}
          </div>
        )}
      </StandardPageLayout>
    </ProtectedRoute>
  );
}
