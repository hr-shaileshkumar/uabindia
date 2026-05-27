"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type ProbationRecord = {
  id: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  status: string;
  reviewScore?: number;
};

export default function ProbationPage() {
  const [records] = useState<ProbationRecord[]>([]);

  return (
    <ModuleTablePage
      title="Probation"
      subtitle="Track employee probation periods, review milestones, and confirmation decisions."
      eyebrow="HRMS / Employee Lifecycle"
      icon="employees"
      toolbarTitle="Probation tracker"
      toolbarSubtitle="Monitor employee probation timelines, review scores, and confirmation status."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} probation records`}
      emptyMessage="No probation records found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All probation cases</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Confirmed</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Confirmed").length}</p><p className="erp-kpi-meta">Passed probation</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Active</p><p className="erp-kpi-value">{records.filter(r => r.status === "Active").length}</p><p className="erp-kpi-meta">Currently on probation</p></div>
          <div className="erp-kpi-card erp-kpi-card-danger"><p className="erp-kpi-label">Extended</p><p className="erp-kpi-value">{records.filter(r => r.status === "Extended").length}</p><p className="erp-kpi-meta">Probation extended</p></div>
        </div>
      }
      columns={[
        { label: "Employee" },
        { label: "Start" },
        { label: "End" },
        { label: "Review Score" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.employeeName}</td>
          <td className="erp-td text-slate-600">{r.startDate}</td>
          <td className="erp-td text-slate-600">{r.endDate}</td>
          <td className="erp-td text-slate-600">{r.reviewScore != null ? `${r.reviewScore}%` : "-"}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-info">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
