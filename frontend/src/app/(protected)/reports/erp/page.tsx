"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type ReportRow = {
  id: string;
  name: string;
  module: string;
  generatedAt: string;
  format: string;
  status: string;
};

export default function ErpReportsPage() {
  const [records] = useState<ReportRow[]>([]);

  return (
    <ModuleTablePage
      title="ERP Reports"
      subtitle="Cross-module operational reports covering procurement, sales, inventory, and fulfilment."
      eyebrow="Reports / ERP"
      icon="briefcase"
      toolbarTitle="ERP report library"
      toolbarSubtitle="Generate and download operational reports across all ERP modules from a single workspace."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} reports`}
      emptyMessage="No ERP reports available."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Reports</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All ERP reports</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Generated</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Generated").length}</p><p className="erp-kpi-meta">Ready to download</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Processing</p><p className="erp-kpi-value">{records.filter(r => r.status === "Processing").length}</p><p className="erp-kpi-meta">Being generated</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Modules</p><p className="erp-kpi-value">{new Set(records.map(r => r.module)).size}</p><p className="erp-kpi-meta">Covered modules</p></div>
        </div>
      }
      columns={[
        { label: "Report Name" },
        { label: "Module" },
        { label: "Generated" },
        { label: "Format" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.name}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-neutral">{r.module}</span></td>
          <td className="erp-td text-slate-600">{r.generatedAt}</td>
          <td className="erp-td text-slate-600">{r.format}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-info">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
