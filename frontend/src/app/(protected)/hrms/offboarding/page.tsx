"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type OffboardingRecord = {
  id: string;
  employeeName: string;
  lastWorkingDay: string;
  reason: string;
  status: string;
};

export default function OffboardingPage() {
  const [records] = useState<OffboardingRecord[]>([]);

  return (
    <ModuleTablePage
      title="Offboarding"
      subtitle="Manage employee exit workflows, clearance checklists, and final settlements."
      eyebrow="HRMS / Employee Lifecycle"
      icon="employees"
      toolbarTitle="Exit pipeline"
      toolbarSubtitle="Track employee exits through structured clearance and handover workflows."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} offboarding records`}
      emptyMessage="No offboarding records found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All exits</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Completed</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Completed").length}</p><p className="erp-kpi-meta">Full clearance done</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">In Progress</p><p className="erp-kpi-value">{records.filter(r => r.status === "InProgress").length}</p><p className="erp-kpi-meta">Clearance pending</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Initiated</p><p className="erp-kpi-value">{records.filter(r => r.status === "Initiated").length}</p><p className="erp-kpi-meta">Just started</p></div>
        </div>
      }
      columns={[
        { label: "Employee" },
        { label: "Last Working Day" },
        { label: "Reason" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.employeeName}</td>
          <td className="erp-td text-slate-600">{r.lastWorkingDay}</td>
          <td className="erp-td text-slate-600">{r.reason}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-warning">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
