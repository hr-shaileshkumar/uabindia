"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type WorkflowRow = {
  id: string;
  name: string;
  triggerEvent: string;
  module: string;
  steps: number;
  status: string;
};

export default function WorkflowConfigPage() {
  const [records] = useState<WorkflowRow[]>([]);

  return (
    <ModuleTablePage
      title="Workflow Configuration"
      subtitle="Define and manage automated approval workflows, escalation paths, and business process rules."
      eyebrow="Platform / Configuration"
      icon="settings"
      toolbarTitle="Workflow engine"
      toolbarSubtitle="Build and manage automated workflows triggered by business events across all ERP modules."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} workflows`}
      emptyMessage="No workflows configured."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Workflows</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All workflows</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Active</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Active").length}</p><p className="erp-kpi-meta">Running workflows</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Draft</p><p className="erp-kpi-value">{records.filter(r => r.status === "Draft").length}</p><p className="erp-kpi-meta">Not published</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Modules Covered</p><p className="erp-kpi-value">{new Set(records.map(r => r.module)).size}</p><p className="erp-kpi-meta">Distinct modules</p></div>
        </div>
      }
      columns={[
        { label: "Workflow" },
        { label: "Trigger" },
        { label: "Module" },
        { label: "Steps" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.name}</td>
          <td className="erp-td text-slate-600">{r.triggerEvent}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-neutral">{r.module}</span></td>
          <td className="erp-td text-slate-600">{r.steps}</td>
          <td className="erp-td"><span className={`erp-chip ${r.status === "Active" ? "erp-chip-success" : "erp-chip-warning"}`}>{r.status}</span></td>
        </tr>
      )}
    />
  );
}
