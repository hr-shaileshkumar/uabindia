"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type BonusRecord = {
  id: string;
  employeeName: string;
  bonusType: string;
  amount: number;
  period: string;
  status: string;
};

export default function PayrollBonusPage() {
  const [records] = useState<BonusRecord[]>([]);

  return (
    <ModuleTablePage
      title="Bonus & Incentives"
      subtitle="Manage employee bonuses, incentive payouts, and performance-linked awards."
      eyebrow="Payroll / Processing"
      icon="payroll"
      toolbarTitle="Bonus register"
      toolbarSubtitle="Review, approve, and disburse bonus and incentive payouts across the workforce."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} bonus records`}
      emptyMessage="No bonus records found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Entries</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All bonus entries</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Approved</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Approved").length}</p><p className="erp-kpi-meta">Ready to disburse</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending</p><p className="erp-kpi-value">{records.filter(r => r.status === "Pending").length}</p><p className="erp-kpi-meta">Awaiting approval</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Total Payout</p><p className="erp-kpi-value">{records.reduce((s, r) => s + r.amount, 0).toLocaleString()}</p><p className="erp-kpi-meta">Sum of bonuses</p></div>
        </div>
      }
      columns={[
        { label: "Employee" },
        { label: "Type" },
        { label: "Period" },
        { label: "Amount" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.employeeName}</td>
          <td className="erp-td text-slate-600">{r.bonusType}</td>
          <td className="erp-td text-slate-600">{r.period}</td>
          <td className="erp-td text-slate-600">{r.amount.toLocaleString()}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-info">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
