"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type ArrearsRecord = {
  id: string;
  employeeName: string;
  period: string;
  amount: number;
  reason: string;
  status: string;
};

export default function PayrollArrearsPage() {
  const [records] = useState<ArrearsRecord[]>([]);

  return (
    <ModuleTablePage
      title="Arrears"
      subtitle="Process salary arrears, backdated revisions, and pending payroll adjustments."
      eyebrow="Payroll / Processing"
      icon="payroll"
      toolbarTitle="Arrears register"
      toolbarSubtitle="Review and process backdated salary differences and arrears payouts."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} arrears entries`}
      emptyMessage="No arrears records found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Entries</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All arrears</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Processed</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Processed").length}</p><p className="erp-kpi-meta">Disbursed</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending</p><p className="erp-kpi-value">{records.filter(r => r.status === "Pending").length}</p><p className="erp-kpi-meta">Awaiting processing</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Total Amount</p><p className="erp-kpi-value">{records.reduce((s, r) => s + r.amount, 0).toLocaleString()}</p><p className="erp-kpi-meta">Sum of arrears</p></div>
        </div>
      }
      columns={[
        { label: "Employee" },
        { label: "Period" },
        { label: "Amount" },
        { label: "Reason" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.employeeName}</td>
          <td className="erp-td text-slate-600">{r.period}</td>
          <td className="erp-td text-slate-600">{r.amount.toLocaleString()}</td>
          <td className="erp-td text-slate-600">{r.reason}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-warning">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
