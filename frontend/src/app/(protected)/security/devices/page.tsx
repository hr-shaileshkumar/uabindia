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

export default function DeviceSessionsPage() {
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
      title="Device Sessions"
      subtitle="Track active devices and session trust across the tenant."
      eyebrow="Security / Trusted Devices"
      icon="shield"
      toolbarTitle="Trusted device ledger"
      toolbarSubtitle="Monitor endpoint trust, expiry, and revocation from the same security control surface."
      loading={loading}
      rows={sessions}
      countLabel={(count) => `${count} sessions`}
      emptyMessage="No device sessions found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Devices</p><p className="erp-kpi-value">{sessions.length}</p><p className="erp-kpi-meta">Device session records</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Active</p><p className="erp-kpi-value erp-kpi-value-success">{sessions.filter(s => !s.isRevoked).length}</p><p className="erp-kpi-meta">Trusted devices</p></div>
          <div className="erp-kpi-card erp-kpi-card-danger"><p className="erp-kpi-label">Revoked</p><p className="erp-kpi-value erp-kpi-value-danger">{sessions.filter(s => s.isRevoked).length}</p><p className="erp-kpi-meta">Untrusted devices</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Unique Devices</p><p className="erp-kpi-value">{new Set(sessions.map(s => s.deviceId).filter(Boolean)).size}</p><p className="erp-kpi-meta">Distinct device IDs</p></div>
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
            <div className="erp-row-meta">Trusted endpoint session</div>
          </td>
          <td className="erp-td text-xs text-slate-500">{new Date(session.expiresAt).toLocaleString()}</td>
          <td className="erp-td">
            <span className={session.isRevoked ? "erp-chip erp-chip-danger" : "erp-chip erp-chip-success"}>
              {session.isRevoked ? "Revoked" : "Trusted"}
            </span>
          </td>
        </tr>
      )}
    />
  );
}
