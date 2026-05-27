"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type ReconciliationRow = {
  id: string;
  accountName: string;
  bankBalance: number;
  bookBalance: number;
  difference: number;
  period: string;
  status: string;
};

export default function BankReconciliationPage() {
  const [records] = useState<ReconciliationRow[]>([]);

  return (
    <ModuleTablePage
      title="Bank Reconciliation"
      subtitle="Reconcile bank statements with ledger balances and identify unmatched transactions."
      eyebrow="Finance / Compliance"
      icon="settings"
      toolbarTitle="Reconciliation workspace"
      toolbarSubtitle="Match bank statement entries to ledger transactions and resolve outstanding differences."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} reconciliation records`}
      emptyMessage="No reconciliation records found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All reconciliations</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Matched</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Matched").length}</p><p className="erp-kpi-meta">Fully reconciled</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Unmatched</p><p className="erp-kpi-value">{records.filter(r => r.status === "Unmatched").length}</p><p className="erp-kpi-meta">Needs resolution</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Total Difference</p><p className="erp-kpi-value">{Math.abs(records.reduce((s, r) => s + r.difference, 0)).toLocaleString()}</p><p className="erp-kpi-meta">Outstanding gap</p></div>
        </div>
      }
      columns={[
        { label: "Account" },
        { label: "Period" },
        { label: "Bank Balance" },
        { label: "Book Balance" },
        { label: "Difference" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.accountName}</td>
          <td className="erp-td text-slate-600">{r.period}</td>
          <td className="erp-td text-slate-600">{r.bankBalance.toLocaleString()}</td>
          <td className="erp-td text-slate-600">{r.bookBalance.toLocaleString()}</td>
          <td className={`erp-td font-medium ${r.difference !== 0 ? "text-red-600" : "text-green-600"}`}>{r.difference.toLocaleString()}</td>
          <td className="erp-td"><span className={`erp-chip ${r.status === "Matched" ? "erp-chip-success" : "erp-chip-warning"}`}>{r.status}</span></td>
        </tr>
      )}
    />
  );
}
