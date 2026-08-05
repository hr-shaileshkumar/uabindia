"use client";

import { useEffect, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
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
      headerStats={
        <CrudHeaderStats
          items={[
            { label: "Devices", value: sessions.length, helper: "sessions" },
            { label: "Active", value: sessions.filter((s) => !s.isRevoked).length, tone: "positive" },
            { label: "Revoked", value: sessions.filter((s) => s.isRevoked).length, tone: "danger" },
            { label: "Unique", value: new Set(sessions.map((s) => s.deviceId).filter(Boolean)).size, tone: "info" },
          ]}
        />
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
