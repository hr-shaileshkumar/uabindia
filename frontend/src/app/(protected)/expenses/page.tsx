"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type ExpenseRow = {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  status: string;
};

export default function ExpensesPage() {
  const [records] = useState<ExpenseRow[]>([]);

  return (
    <ModuleTablePage
      title="Expenses"
      subtitle="Track business expenses, category-wise spending, and approval workflows."
      eyebrow="Finance / Transactions"
      icon="file"
      toolbarTitle="Expense ledger"
      toolbarSubtitle="Review approved and pending business expenses with category and approval state breakdown."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} expenses`}
      emptyMessage="No expenses found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All expenses</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Approved</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Approved").length}</p><p className="erp-kpi-meta">Cleared</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending</p><p className="erp-kpi-value">{records.filter(r => r.status === "Pending").length}</p><p className="erp-kpi-meta">Under review</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Total Spend</p><p className="erp-kpi-value">{records.reduce((s, r) => s + r.amount, 0).toLocaleString()}</p><p className="erp-kpi-meta">Sum of expenses</p></div>
        </div>
      }
      columns={[
        { label: "Description" },
        { label: "Category" },
        { label: "Amount" },
        { label: "Date" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.description}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-neutral">{r.category}</span></td>
          <td className="erp-td text-slate-600">{r.amount.toLocaleString()}</td>
          <td className="erp-td text-slate-600">{r.date}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-info">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
