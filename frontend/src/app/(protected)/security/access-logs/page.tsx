"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";

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
      headerStats={
        <CrudHeaderStats
          items={[
            { label: "Events", value: records.length, helper: "access" },
            { label: "Successful", value: records.filter((r) => r.result === "Success").length, tone: "positive" },
            { label: "Failed", value: records.filter((r) => r.result === "Failed").length, tone: "danger" },
            { label: "IPs", value: new Set(records.map((r) => r.ipAddress)).size, tone: "info" },
          ]}
        />
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
