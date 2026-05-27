"use client";

import { useEffect, useMemo, useState } from "react";
import { hrApi } from "@/services/hrApi";
import ProtectedRoute from "@/components/ProtectedRoute";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { PERMISSIONS } from "@/constants/permissions";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError } from "@/lib/notifications";

interface AuditRow {
  id: string;
  entityName: string;
  entityId?: string | null;
  action: string;
  performedAt: string;
  performedBy?: string | null;
  ip?: string | null;
}

interface AuditLogResponse {
  logs?: AuditRow[];
  total?: number;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [userId, setUserId] = useState("");
  const [projectId, setProjectId] = useState("");

  const [page] = useState(1);
  const [total, setTotal] = useState(0);

  const queryParams = useMemo(
    () => ({
      page,
      limit: 50,
      entity: entity.trim() || undefined,
      action: action.trim() || undefined,
      performedBy: userId.trim() || undefined,
      projectId: projectId.trim() || undefined,
    }),
    [page, entity, action, userId, projectId]
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await hrApi.platform.auditLogs(queryParams);
        const data = (res.data || {}) as AuditLogResponse;
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      } catch (err) {
        const message = getApiErrorMessage(err, "Failed to load audit logs");
        setError(message);
        notifyError(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [queryParams]);

  return (
    <ProtectedRoute permission={PERMISSIONS.AUDIT_VIEW}>
      <StandardPageLayout
        title="Audit Logs"
        subtitle="Compliance and traceability records with user/project filtering"
        eyebrow="Administration / Governance"
        icon="file"
        actions={
          <span className="erp-toolbar-badge">
            {loading ? "Loading..." : `${total} events`}
          </span>
        }
        filters={
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              placeholder="Entity (Companies, Users...)"
              className="erp-input"
            />
            <input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Action (Created, Updated...)"
              className="erp-input"
            />
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="User ID"
              className="erp-input"
            />
            <input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="Project ID"
              className="erp-input"
            />
          </div>
        }
      >
        {error && <div className="erp-alert-error">{error}</div>}

        {/* KPI summary cards */}
        <div className="erp-kpi-grid mb-4">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Events</p><p className="erp-kpi-value">{total}</p><p className="erp-kpi-meta">Loaded audit records</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Loaded Logs</p><p className="erp-kpi-value">{logs.length}</p><p className="erp-kpi-meta">Current page entries</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Entities</p><p className="erp-kpi-value">{new Set(logs.map(l => l.entityName)).size}</p><p className="erp-kpi-meta">Distinct entity types</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Actions</p><p className="erp-kpi-value erp-kpi-value-success">{new Set(logs.map(l => l.action)).size}</p><p className="erp-kpi-meta">Distinct action types</p></div>
        </div>

        <div className="erp-panel">
          <div className="erp-table-toolbar">
            <div>
              <div className="erp-table-title">Governance event stream</div>
              <div className="erp-table-subtitle">Track platform changes, actor identity, and source IP details in a compact audit grid.</div>
            </div>
          </div>
          <div className="erp-table-wrap rounded-none border-0 shadow-none">
            <table className="erp-table">
              <thead className="erp-thead">
                <tr>
                  <th className="erp-th">Entity</th>
                  <th className="erp-th">Action</th>
                  <th className="erp-th">Entity ID</th>
                  <th className="erp-th">Performed By</th>
                  <th className="erp-th">IP</th>
                  <th className="erp-th">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="erp-tr">
                    <td className="erp-td">
                      <div className="erp-row-title">{log.entityName}</div>
                      <div className="erp-row-meta">Governed object</div>
                    </td>
                    <td className="erp-td">
                      <span className="erp-chip erp-chip-info">{log.action}</span>
                    </td>
                    <td className="erp-td text-xs text-slate-500">{log.entityId || "-"}</td>
                    <td className="erp-td text-xs text-slate-500">{log.performedBy || "-"}</td>
                    <td className="erp-td text-xs text-slate-500">{log.ip || "-"}</td>
                    <td className="erp-td text-xs text-slate-500">{new Date(log.performedAt).toLocaleString()}</td>
                  </tr>
                ))}

                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="erp-td py-10 text-center text-sm text-slate-500">
                      No audit logs found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </StandardPageLayout>
    </ProtectedRoute>
  );
}
