"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type FinancialReportRow = {
  id: string;
  name: string;
  type: string;
  period: string;
  generatedAt: string;
  status: string;
};

export default function FinancialReportsPage() {
  const [records] = useState<FinancialReportRow[]>([]);

  return (
    <ModuleTablePage
      title="Financial Reports"
      subtitle="P&L statements, balance sheets, cash flow reports, and financial performance analytics."
      eyebrow="Reports / Finance"
      icon="payroll"
      toolbarTitle="Financial report library"
      toolbarSubtitle="Access statutory and management financial reports for period-wise performance analysis."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} reports`}
      emptyMessage="No financial reports available."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All financial reports</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Ready</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Ready").length}</p><p className="erp-kpi-meta">Available to view</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Processing</p><p className="erp-kpi-value">{records.filter(r => r.status === "Processing").length}</p><p className="erp-kpi-meta">Being compiled</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Report Types</p><p className="erp-kpi-value">{new Set(records.map(r => r.type)).size}</p><p className="erp-kpi-meta">Distinct report types</p></div>
        </div>
      }
      columns={[
        { label: "Report" },
        { label: "Type" },
        { label: "Period" },
        { label: "Generated" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.name}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-neutral">{r.type}</span></td>
          <td className="erp-td text-slate-600">{r.period}</td>
          <td className="erp-td text-slate-600">{r.generatedAt}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-info">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
