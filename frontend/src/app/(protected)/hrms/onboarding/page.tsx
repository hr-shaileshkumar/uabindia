"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type OnboardingRecord = {
  id: string;
  employeeName: string;
  startDate: string;
  status: string;
  completedSteps: number;
  totalSteps: number;
};

const MOCK_RECORDS: OnboardingRecord[] = [];

export default function OnboardingPage() {
  const [records] = useState<OnboardingRecord[]>(MOCK_RECORDS);

  return (
    <ModuleTablePage
      title="Onboarding"
      subtitle="Manage employee onboarding workflows, task checklists, and progress tracking."
      eyebrow="HRMS / Employee Lifecycle"
      icon="employees"
      toolbarTitle="Onboarding pipeline"
      toolbarSubtitle="Track new hire progress through structured onboarding stages and task completion."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} onboarding records`}
      emptyMessage="No onboarding records found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All onboarding</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Completed</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Completed").length}</p><p className="erp-kpi-meta">Fully onboarded</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">In Progress</p><p className="erp-kpi-value">{records.filter(r => r.status === "InProgress").length}</p><p className="erp-kpi-meta">Active onboarding</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Pending</p><p className="erp-kpi-value">{records.filter(r => r.status === "Pending").length}</p><p className="erp-kpi-meta">Not started</p></div>
        </div>
      }
      columns={[
        { label: "Employee" },
        { label: "Start Date" },
        { label: "Progress" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.employeeName}</td>
          <td className="erp-td text-slate-600">{r.startDate}</td>
          <td className="erp-td text-slate-600">{r.completedSteps}/{r.totalSteps} steps</td>
          <td className="erp-td"><span className="erp-chip erp-chip-info">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
