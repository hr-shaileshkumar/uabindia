"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type CustomReportRow = {
  id: string;
  name: string;
  createdBy: string;
  lastRun: string;
  schedule: string;
  status: string;
};

export default function CustomReportsPage() {
  const [records] = useState<CustomReportRow[]>([]);

  return (
    <ModuleTablePage
      title="Custom Reports"
      subtitle="Build, schedule, and manage bespoke reports with custom filters and export configurations."
      eyebrow="Reports / Advanced"
      icon="settings"
      toolbarTitle="Custom report builder"
      toolbarSubtitle="Design and manage ad-hoc reports with configurable columns, filters, and delivery schedules."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} custom reports`}
      emptyMessage="No custom reports found. Create your first report."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">Custom reports</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Scheduled</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.schedule !== "Manual").length}</p><p className="erp-kpi-meta">Auto-run reports</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Manual</p><p className="erp-kpi-value">{records.filter(r => r.schedule === "Manual").length}</p><p className="erp-kpi-meta">On-demand only</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Active</p><p className="erp-kpi-value">{records.filter(r => r.status === "Active").length}</p><p className="erp-kpi-meta">Enabled reports</p></div>
        </div>
      }
      columns={[
        { label: "Report Name" },
        { label: "Created By" },
        { label: "Last Run" },
        { label: "Schedule" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.name}</td>
          <td className="erp-td text-slate-600">{r.createdBy}</td>
          <td className="erp-td text-slate-600">{r.lastRun}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-neutral">{r.schedule}</span></td>
          <td className="erp-td"><span className="erp-chip erp-chip-info">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
