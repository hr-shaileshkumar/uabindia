"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";

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
      headerStats={
        <CrudHeaderStats
          items={[
            { label: "Modules", value: records.length, helper: "tracked" },
            {
              label: "Users",
              value: records.reduce((total, record) => total + record.activeUsers, 0),
              helper: "active",
              tone: "info",
            },
            {
              label: "API Calls",
              value: records.reduce((total, record) => total + record.apiCalls, 0).toLocaleString(),
              helper: "period",
              tone: "warning",
            },
            {
              label: "Storage",
              value: `${records.reduce((total, record) => total + record.storageUsedMb, 0).toLocaleString()} MB`,
              helper: "used",
              tone: "positive",
            },
          ]}
        />
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
