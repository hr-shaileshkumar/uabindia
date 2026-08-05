"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";

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
      headerStats={
        <CrudHeaderStats
          items={[
            { label: "Claims", value: records.length, helper: "total" },
            {
              label: "Approved",
              value: records.filter((record) => record.status === "Approved").length,
              tone: "positive",
            },
            {
              label: "Pending",
              value: records.filter((record) => record.status === "Pending").length,
              tone: "warning",
            },
            {
              label: "Amount",
              value: records.reduce((total, record) => total + record.amount, 0).toLocaleString(),
              helper: "sum",
              tone: "info",
            },
          ]}
        />
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
