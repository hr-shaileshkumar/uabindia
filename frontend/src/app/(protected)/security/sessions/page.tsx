"use client";

import { useEffect, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { hrApi } from "@/services/hrApi";

type SessionRow = {
  id: string;
  deviceId: string;
  expiresAt: string;
  isRevoked: boolean;
};

export default function RefreshTokensPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await hrApi.security.deviceSessions();
        setSessions(res.data.sessions || []);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <ModuleTablePage
      title="Refresh Tokens"
      subtitle="Review active refresh-token sessions and lifecycle state."
      eyebrow="Security / Session Runtime"
      icon="shield"
      toolbarTitle="Refresh-token sessions"
      toolbarSubtitle="Inspect device-linked session validity and revocation state from a compact security grid."
      loading={loading}
      rows={sessions}
      countLabel={(count) => `${count} sessions`}
      emptyMessage="No refresh tokens found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Sessions</p><p className="erp-kpi-value">{sessions.length}</p><p className="erp-kpi-meta">All refresh tokens</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Active</p><p className="erp-kpi-value erp-kpi-value-success">{sessions.filter(s => !s.isRevoked).length}</p><p className="erp-kpi-meta">Valid sessions</p></div>
          <div className="erp-kpi-card erp-kpi-card-danger"><p className="erp-kpi-label">Revoked</p><p className="erp-kpi-value erp-kpi-value-danger">{sessions.filter(s => s.isRevoked).length}</p><p className="erp-kpi-meta">Invalidated sessions</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Devices</p><p className="erp-kpi-value">{new Set(sessions.map(s => s.deviceId).filter(Boolean)).size}</p><p className="erp-kpi-meta">Unique devices</p></div>
        </div>
      }
      columns={[
        { label: "Device" },
        { label: "Expires" },
        { label: "Status" },
      ]}
      renderRow={(session) => (
        <tr key={session.id} className="erp-tr">
          <td className="erp-td">
            <div className="erp-row-title">{session.deviceId}</div>
            <div className="erp-row-meta">Refresh-token holder</div>
          </td>
          <td className="erp-td text-xs text-slate-500">{new Date(session.expiresAt).toLocaleString()}</td>
          <td className="erp-td">
            <span className={session.isRevoked ? "erp-chip erp-chip-danger" : "erp-chip erp-chip-success"}>
              {session.isRevoked ? "Revoked" : "Active"}
            </span>
          </td>
        </tr>
      )}
    />
  );
}
