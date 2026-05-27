"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type LoanRecord = {
  id: string;
  employeeName: string;
  loanAmount: number;
  outstanding: number;
  emiAmount: number;
  status: string;
};

export default function PayrollLoansPage() {
  const [records] = useState<LoanRecord[]>([]);

  return (
    <ModuleTablePage
      title="Loan Management"
      subtitle="Manage employee loans, EMI deduction schedules, and outstanding balances."
      eyebrow="Payroll / Setup"
      icon="file"
      toolbarTitle="Loan register"
      toolbarSubtitle="Track employee loans, monthly EMI deductions, and outstanding principal balances."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} loan records`}
      emptyMessage="No loan records found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Loans</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All active loans</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Closed</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Closed").length}</p><p className="erp-kpi-meta">Fully repaid</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Active</p><p className="erp-kpi-value">{records.filter(r => r.status === "Active").length}</p><p className="erp-kpi-meta">Ongoing repayment</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Outstanding</p><p className="erp-kpi-value">{records.reduce((s, r) => s + r.outstanding, 0).toLocaleString()}</p><p className="erp-kpi-meta">Total outstanding</p></div>
        </div>
      }
      columns={[
        { label: "Employee" },
        { label: "Loan Amount" },
        { label: "Outstanding" },
        { label: "EMI" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.employeeName}</td>
          <td className="erp-td text-slate-600">{r.loanAmount.toLocaleString()}</td>
          <td className="erp-td text-slate-600">{r.outstanding.toLocaleString()}</td>
          <td className="erp-td text-slate-600">{r.emiAmount.toLocaleString()}/mo</td>
          <td className="erp-td"><span className="erp-chip erp-chip-info">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
