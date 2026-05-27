"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type AccessLogRow = {
  id: string;
  userEmail: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  result: string;
};

export default function AccessLogsPage() {
  const [records] = useState<AccessLogRow[]>([]);

  return (
    <ModuleTablePage
      title="Access Logs"
      subtitle="Audit login attempts, session events, and authentication activity across the platform."
      eyebrow="Security / Sessions"
      icon="file"
      toolbarTitle="Access event log"
      toolbarSubtitle="Review chronological authentication events including successful logins, failures, and logouts."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} events`}
      emptyMessage="No access log events found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Events</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All access events</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Successful</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.result === "Success").length}</p><p className="erp-kpi-meta">Authorized access</p></div>
          <div className="erp-kpi-card erp-kpi-card-danger"><p className="erp-kpi-label">Failed</p><p className="erp-kpi-value">{records.filter(r => r.result === "Failed").length}</p><p className="erp-kpi-meta">Denied attempts</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Unique IPs</p><p className="erp-kpi-value">{new Set(records.map(r => r.ipAddress)).size}</p><p className="erp-kpi-meta">Distinct origins</p></div>
        </div>
      }
      columns={[
        { label: "User" },
        { label: "Action" },
        { label: "IP Address" },
        { label: "Timestamp" },
        { label: "Result" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.userEmail}</td>
          <td className="erp-td text-slate-600">{r.action}</td>
          <td className="erp-td font-mono text-xs text-slate-600">{r.ipAddress}</td>
          <td className="erp-td text-slate-600 text-xs">{r.timestamp}</td>
          <td className="erp-td"><span className={`erp-chip ${r.result === "Success" ? "erp-chip-success" : "erp-chip-danger"}`}>{r.result}</span></td>
        </tr>
      )}
    />
  );
}
