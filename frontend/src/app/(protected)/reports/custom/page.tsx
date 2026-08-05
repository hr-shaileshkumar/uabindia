"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";

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
      headerStats={
        <ErpHeaderSummary
          items={[
            { label: "Reports", value: records.length },
            {
              label: "Scheduled",
              value: records.filter((record) => record.schedule !== "Manual").length,
              tone: "success",
            },
            {
              label: "Manual",
              value: records.filter((record) => record.schedule === "Manual").length,
              tone: "warning",
            },
            {
              label: "Active",
              value: records.filter((record) => record.status === "Active").length,
              tone: "info",
            },
          ]}
        />
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
