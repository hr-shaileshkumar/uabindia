"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type FinalSettlementRecord = {
  id: string;
  employeeName: string;
  exitDate: string;
  gratuity: number;
  leaveEncashment: number;
  totalSettlement: number;
  status: string;
};

export default function FinalSettlementPage() {
  const [records] = useState<FinalSettlementRecord[]>([]);

  return (
    <ModuleTablePage
      title="Final Settlement"
      subtitle="Process full-and-final settlements for exiting employees including gratuity and leave encashment."
      eyebrow="Payroll / Compliance"
      icon="file"
      toolbarTitle="F&F settlement register"
      toolbarSubtitle="Review and process full-and-final settlement breakdowns for separated employees."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} settlement records`}
      emptyMessage="No final settlement records found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All settlements</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Settled</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Settled").length}</p><p className="erp-kpi-meta">Fully processed</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending</p><p className="erp-kpi-value">{records.filter(r => r.status === "Pending").length}</p><p className="erp-kpi-meta">Under process</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Total Paid Out</p><p className="erp-kpi-value">{records.reduce((s, r) => s + r.totalSettlement, 0).toLocaleString()}</p><p className="erp-kpi-meta">Sum of F&amp;F</p></div>
        </div>
      }
      columns={[
        { label: "Employee" },
        { label: "Exit Date" },
        { label: "Gratuity" },
        { label: "Leave Encashment" },
        { label: "Total" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.employeeName}</td>
          <td className="erp-td text-slate-600">{r.exitDate}</td>
          <td className="erp-td text-slate-600">{r.gratuity.toLocaleString()}</td>
          <td className="erp-td text-slate-600">{r.leaveEncashment.toLocaleString()}</td>
          <td className="erp-td font-medium text-slate-900">{r.totalSettlement.toLocaleString()}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-info">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
