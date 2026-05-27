"use client";

import { useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { usePermissions } from "@/context/PermissionContext";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionBar } from "@/components/table/BulkActionBar";
import { SelectionCheckbox } from "@/components/table/SelectionCheckbox";
import { SelectAllCheckbox } from "@/components/table/SelectAllCheckbox";

type DeletedLogRow = {
  id: string;
  tenantId?: string;
  entityName?: string;
  entityId?: string;
  action?: string;
  performedAt?: string;
  performedBy?: string;
  ip?: string;
};

const toObj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};

const asString = (v: unknown): string => (typeof v === "string" ? v : "");

export default function RecycleBinPage() {
  const { confirm, confirmDialog } = useConfirmDialog();
  const { isSuperAdmin } = usePermissions();

  const [rows, setRows] = useState<DeletedLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await hrApi.platform.recycleBin.listDeleted({ page: 1, limit: 200, entity: entityFilter || undefined });
      const payload = toObj(res.data);
      const logsRaw = Array.isArray(payload.logs) ? (payload.logs as unknown[]) : [];

      const normalized = logsRaw.map((item) => {
        const raw = toObj(item);
        return {
          id: asString(raw.id || raw.Id),
          tenantId: asString(raw.tenantId || raw.TenantId) || undefined,
          entityName: asString(raw.entityName || raw.EntityName) || undefined,
          entityId: asString(raw.entityId || raw.EntityId) || undefined,
          action: asString(raw.action || raw.Action) || undefined,
          performedAt: asString(raw.performedAt || raw.PerformedAt) || undefined,
          performedBy: asString(raw.performedBy || raw.PerformedBy) || undefined,
          ip: asString(raw.ip || raw.Ip) || undefined,
        } satisfies DeletedLogRow;
      });

      setRows(normalized);
      setError(null);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load deleted records");
      setError(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityFilter]);

  const filtered = useMemo(() => {
    const key = search.trim().toLowerCase();
    if (!key) return rows;
    return rows.filter((r) =>
      (r.entityName || "").toLowerCase().includes(key) ||
      (r.entityId || "").toLowerCase().includes(key) ||
      (r.tenantId || "").toLowerCase().includes(key) ||
      (r.performedBy || "").toLowerCase().includes(key)
    );
  }, [rows, search]);

  // ─── Bulk selection ──────────────────────────────────────────────────────────
  const selection = useTableSelection<DeletedLogRow>();
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    selection.setItems(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  /**
   * Resolve the effective entity ID for restore/delete operations.
   * When the audit log row has no entityId (common for tenant-level records),
   * fall back to tenantId for Tenant entities since the tenant IS the entity.
   */
  const resolveEntityId = (row: DeletedLogRow): string | null => {
    if (row.entityId) return row.entityId;
    // For Tenant records the deleted entity's ID equals the tenant context ID
    const name = (row.entityName ?? "").toLowerCase();
    if ((name === "tenants" || name === "tenant") && row.tenantId) return row.tenantId;
    return null;
  };

  /**
   * Remove ALL audit-log rows that refer to the same resolved entity ID.
   * One physical delete creates multiple audit-log rows (one per cascade),
   * so after acting on the entity we clean up all sibling rows in the UI.
   */
  const removeRowsByEntityId = (entityId: string) =>
    setRows((prev) => prev.filter((r) => resolveEntityId(r) !== entityId));

  const handleRestore = async (row: DeletedLogRow) => {
    const entityId = resolveEntityId(row);
    if (!row.entityName || !entityId) {
      notifyError("Cannot restore: record has no entity ID.");
      return;
    }
    try {
      const res = await hrApi.platform.recycleBin.restore(row.entityName, entityId);
      const data = res.data as Record<string, unknown>;
      if (data?.alreadyGone) {
        removeRowsByEntityId(entityId);
        notifySuccess("Record was already restored — removed from list.");
        return;
      }
      notifySuccess("Record restored successfully.");
      removeRowsByEntityId(entityId);
      await load();
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to restore record");
      setError(msg);
      notifyError(msg);
    }
  };

  const handleHardDelete = async (row: DeletedLogRow) => {
    const entityId = resolveEntityId(row);
    if (!row.entityName || !entityId) {
      notifyError("Cannot delete: record has no entity ID.");
      return;
    }

    const ok = await confirm({
      title: "Permanent delete",
      message: `Permanently delete ${row.entityName} record from database? This cannot be undone.`,
      confirmText: "Permanent Delete",
      variant: "danger",
    });
    if (!ok) return;

    try {
      const res = await hrApi.platform.recycleBin.hardDelete(row.entityName, entityId);
      const data = res.data as Record<string, unknown>;
      if (data?.alreadyGone) {
        removeRowsByEntityId(entityId);
        notifySuccess("Record was already permanently deleted — removed from list.");
        return;
      }
      // Audit log entries for this entity are purged server-side — just clean up UI
      removeRowsByEntityId(entityId);
      notifySuccess("Record permanently deleted from database.");
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to permanently delete record");
      setError(msg);
      notifyError(msg);
    }
  };

  const handleBulkRestore = async () => {
    const count = selection.selectionCount;
    const ok = await confirm({
      title: "Bulk restore",
      message: `Restore ${count} selected record${count === 1 ? "" : "s"}?`,
      confirmText: "Restore All",
    });
    if (!ok) return;
    setBulkBusy(true);
    let successCount = 0;
    const removedEntityIds = new Set<string>();

    // Deduplicate by resolved entityId — only call the API once per physical entity
    const seenEntityIds = new Set<string>();
    for (const row of selection.selectedItems) {
      const entityId = resolveEntityId(row);
      if (!row.entityName || !entityId) continue;
      if (seenEntityIds.has(entityId)) {
        removedEntityIds.add(entityId); // will be cleaned up after
        continue;
      }
      seenEntityIds.add(entityId);
      try {
        const res = await hrApi.platform.recycleBin.restore(row.entityName, entityId);
        const data = res.data as Record<string, unknown>;
        removedEntityIds.add(entityId);
        if (!data?.alreadyGone) successCount += 1;
      } catch { /* continue on per-row failure */ }
    }
    setBulkBusy(false);
    // Remove all sibling audit-log rows for every acted-on entity
    if (removedEntityIds.size > 0) {
      setRows((prev) => prev.filter((r) => {
        const eid = resolveEntityId(r);
        return !eid || !removedEntityIds.has(eid);
      }));
    }
    selection.clearSelection();
    notifySuccess(`Restored ${successCount} record${successCount === 1 ? "" : "s"}.`);
    if (successCount > 0) await load();
  };

  const handleBulkHardDelete = async () => {
    const count = selection.selectionCount;
    const ok = await confirm({
      title: "Bulk permanent delete",
      message: `Permanently delete ${count} selected record${count === 1 ? "" : "s"}? This cannot be undone.`,
      confirmText: "Permanently Delete All",
      variant: "danger",
    });
    if (!ok) return;
    setBulkBusy(true);
    let successCount = 0;
    const removedEntityIds = new Set<string>();

    // Deduplicate by resolved entityId — only call the API once per physical entity
    const seenEntityIds = new Set<string>();
    for (const row of selection.selectedItems) {
      const entityId = resolveEntityId(row);
      if (!row.entityName || !entityId) continue;
      if (seenEntityIds.has(entityId)) {
        removedEntityIds.add(entityId);
        continue;
      }
      seenEntityIds.add(entityId);
      try {
        const res = await hrApi.platform.recycleBin.hardDelete(row.entityName, entityId);
        const data = res.data as Record<string, unknown>;
        removedEntityIds.add(entityId);
        if (!data?.alreadyGone) successCount += 1;
      } catch { /* continue on per-row failure */ }
    }
    setBulkBusy(false);
    // Remove all sibling audit-log rows for every acted-on entity
    if (removedEntityIds.size > 0) {
      setRows((prev) => prev.filter((r) => {
        const eid = resolveEntityId(r);
        return !eid || !removedEntityIds.has(eid);
      }));
    }
    selection.clearSelection();
    // Audit log entries purged server-side; UI already updated via setRows above
    notifySuccess(`Permanently deleted ${successCount} record${successCount === 1 ? "" : "s"} from database.`);
  };

  if (!isSuperAdmin) {
    return (
      <StandardPageLayout
        title="Recycle Bin"
        subtitle="Centralized deleted-data controls for SuperAdmin"
        eyebrow="Platform / Governance"
      >
        <div className="erp-alert-error">Only SuperAdmin can access Recycle Bin.</div>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      title="Recycle Bin"
      subtitle="View deleted data across modules and restore or permanently delete records."
      eyebrow="Platform / Governance"
      actions={
        <button onClick={() => void load()} className="erp-action-btn erp-action-btn-secondary">
          Refresh
        </button>
      }
      filters={
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by entity, id, tenant..."
            className="erp-input md:col-span-2"
          />
          <input
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            placeholder="Filter entity (e.g. Users, Projects, Companies)"
            className="erp-input"
          />
        </div>
      }
    >
      {confirmDialog}

      {/* KPI summary cards */}
      <div className="erp-kpi-grid mb-4">
        <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Deleted Records</p><p className="erp-kpi-value">{rows.length}</p><p className="erp-kpi-meta">Soft-deleted entries</p></div>
        <div className="erp-kpi-card"><p className="erp-kpi-label">Filtered</p><p className="erp-kpi-value">{filtered.length}</p><p className="erp-kpi-meta">Matching search</p></div>
        <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Entity Types</p><p className="erp-kpi-value">{new Set(rows.map(r => r.entityName).filter(Boolean)).size}</p><p className="erp-kpi-meta">Distinct data models</p></div>
        <div className="erp-kpi-card erp-kpi-card-danger"><p className="erp-kpi-label">Selected</p><p className="erp-kpi-value erp-kpi-value-danger">{selection.selectionCount}</p><p className="erp-kpi-meta">Pending bulk action</p></div>
      </div>

      {error && <div className="erp-alert-error mb-4">{error}</div>}

      {/* Bulk action bar */}
      {selection.selectionCount > 0 && (
        <BulkActionBar
          selectionCount={selection.selectionCount}
          recycleBinMode
          onRestore={() => void handleBulkRestore()}
          onHardDelete={() => void handleBulkHardDelete()}
          onRefresh={() => { selection.clearSelection(); void load(); }}
          onClear={selection.clearSelection}
          loading={bulkBusy}
        />
      )}

      <div className="erp-panel">
        <div className="erp-table-toolbar">
          <div>
            <div className="erp-table-title">Deleted Records</div>
            <div className="erp-table-subtitle">Centralized audit-backed recycle bin</div>
          </div>
          <span className="erp-toolbar-badge">{loading ? "Loading..." : `${filtered.length} records`}</span>
        </div>

        <div className="erp-table-wrap rounded-none border-0 shadow-none">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">
                  <SelectAllCheckbox
                    checked={selection.isAllSelected}
                    indeterminate={selection.isIndeterminate}
                    onChange={selection.isAllSelected ? selection.clearSelection : selection.selectAll}
                  />
                </th>
                <th className="erp-th">Entity</th>
                <th className="erp-th">Record ID</th>
                <th className="erp-th">Tenant</th>
                <th className="erp-th">Deleted At</th>
                <th className="erp-th">Deleted By</th>
                <th className="erp-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const resolvedId = resolveEntityId(row);
                const canAct = !!row.entityName;
                return (
                <tr key={row.id} className="erp-tr">
                  <td className="erp-td">
                    <SelectionCheckbox
                      checked={selection.isSelected(row.id)}
                      onChange={() => selection.toggleSelection(row.id)}
                      label={`Select ${row.entityName ?? "row"}`}
                    />
                  </td>
                  <td className="erp-td">{row.entityName || "—"}</td>
                  <td className="erp-td font-mono text-xs">
                    {resolvedId
                      ? <span title={resolvedId}>{resolvedId}</span>
                      : <span className="text-slate-400 italic">no id</span>
                    }
                  </td>
                  <td className="erp-td font-mono text-xs">{row.tenantId || "—"}</td>
                  <td className="erp-td text-xs">{row.performedAt ? new Date(row.performedAt).toLocaleString() : "—"}</td>
                  <td className="erp-td font-mono text-xs">{row.performedBy || "—"}</td>
                  <td className="erp-td">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => void handleRestore(row)}
                        disabled={!canAct}
                        title="Restore record"
                        className="rounded-lg border border-green-300 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => void handleHardDelete(row)}
                        disabled={!canAct}
                        title="Permanently delete record"
                        className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Permanent Delete
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="erp-td py-10 text-center text-slate-500">
                    No deleted records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </StandardPageLayout>
  );
}
