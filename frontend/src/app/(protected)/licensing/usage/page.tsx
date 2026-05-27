"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type UsageRow = {
  id: string;
  moduleKey: string;
  moduleName: string;
  activeUsers: number;
  apiCalls: number;
  storageUsedMb: number;
  period: string;
};

export default function LicensingUsagePage() {
  const [records] = useState<UsageRow[]>([]);

  return (
    <ModuleTablePage
      title="Usage Analytics"
      subtitle="Monitor active users, API consumption, and resource utilization per module."
      eyebrow="Licensing / Billing"
      icon="dashboard"
      toolbarTitle="Usage dashboard"
      toolbarSubtitle="Track per-module consumption metrics including active sessions, API calls, and storage."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} modules tracked`}
      emptyMessage="No usage data available."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Modules Active</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">Tracked modules</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Total Active Users</p><p className="erp-kpi-value">{records.reduce((s, r) => s + r.activeUsers, 0)}</p><p className="erp-kpi-meta">Across all modules</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Total API Calls</p><p className="erp-kpi-value">{records.reduce((s, r) => s + r.apiCalls, 0).toLocaleString()}</p><p className="erp-kpi-meta">This period</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Storage Used</p><p className="erp-kpi-value">{records.reduce((s, r) => s + r.storageUsedMb, 0).toLocaleString()} MB</p><p className="erp-kpi-meta">Total consumed</p></div>
        </div>
      }
      columns={[
        { label: "Module" },
        { label: "Active Users" },
        { label: "API Calls" },
        { label: "Storage (MB)" },
        { label: "Period" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.moduleName}</td>
          <td className="erp-td text-slate-600">{r.activeUsers}</td>
          <td className="erp-td text-slate-600">{r.apiCalls.toLocaleString()}</td>
          <td className="erp-td text-slate-600">{r.storageUsedMb.toLocaleString()}</td>
          <td className="erp-td text-slate-600">{r.period}</td>
        </tr>
      )}
    />
  );
}
