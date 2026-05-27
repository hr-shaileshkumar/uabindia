"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type TaxDeclarationRecord = {
  id: string;
  employeeName: string;
  financialYear: string;
  regime: string;
  declaredAmount: number;
  approvedAmount: number;
  status: string;
};

export default function TaxDeclarationsPage() {
  const [records] = useState<TaxDeclarationRecord[]>([]);

  return (
    <ModuleTablePage
      title="Tax Declarations"
      subtitle="Manage employee investment declarations, proof submission, and tax regime selections."
      eyebrow="Payroll / Compliance"
      icon="shield"
      toolbarTitle="Tax declaration register"
      toolbarSubtitle="Review employee investment declarations, approve proofs, and finalize tax computation."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} declarations`}
      emptyMessage="No tax declarations found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All declarations</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Approved</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Approved").length}</p><p className="erp-kpi-meta">Verified proofs</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending</p><p className="erp-kpi-value">{records.filter(r => r.status === "Pending").length}</p><p className="erp-kpi-meta">Awaiting review</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">New Regime</p><p className="erp-kpi-value">{records.filter(r => r.regime === "New").length}</p><p className="erp-kpi-meta">New tax regime</p></div>
        </div>
      }
      columns={[
        { label: "Employee" },
        { label: "FY" },
        { label: "Regime" },
        { label: "Declared" },
        { label: "Approved" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.employeeName}</td>
          <td className="erp-td text-slate-600">{r.financialYear}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-neutral">{r.regime}</span></td>
          <td className="erp-td text-slate-600">{r.declaredAmount.toLocaleString()}</td>
          <td className="erp-td text-slate-600">{r.approvedAmount.toLocaleString()}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-info">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
