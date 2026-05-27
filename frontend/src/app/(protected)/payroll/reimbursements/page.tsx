"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type ReimbursementRecord = {
  id: string;
  employeeName: string;
  category: string;
  amount: number;
  submittedDate: string;
  status: string;
};

export default function PayrollReimbursementsPage() {
  const [records] = useState<ReimbursementRecord[]>([]);

  return (
    <ModuleTablePage
      title="Reimbursements"
      subtitle="Process employee expense reimbursements, approvals, and payment tracking."
      eyebrow="Payroll / Setup"
      icon="file"
      toolbarTitle="Reimbursement register"
      toolbarSubtitle="Review submitted reimbursement claims, approval status, and disbursement state."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} reimbursements`}
      emptyMessage="No reimbursement records found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All claims</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Approved</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Approved").length}</p><p className="erp-kpi-meta">Ready to pay</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending</p><p className="erp-kpi-value">{records.filter(r => r.status === "Pending").length}</p><p className="erp-kpi-meta">Under review</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Total Amount</p><p className="erp-kpi-value">{records.reduce((s, r) => s + r.amount, 0).toLocaleString()}</p><p className="erp-kpi-meta">Sum of claims</p></div>
        </div>
      }
      columns={[
        { label: "Employee" },
        { label: "Category" },
        { label: "Amount" },
        { label: "Submitted" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.employeeName}</td>
          <td className="erp-td text-slate-600">{r.category}</td>
          <td className="erp-td text-slate-600">{r.amount.toLocaleString()}</td>
          <td className="erp-td text-slate-600">{r.submittedDate}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-info">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
