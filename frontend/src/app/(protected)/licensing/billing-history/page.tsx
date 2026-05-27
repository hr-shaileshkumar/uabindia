"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type BillingRow = {
  id: string;
  invoiceNumber: string;
  period: string;
  amount: number;
  plan: string;
  paidDate: string;
  status: string;
};

export default function LicensingBillingHistoryPage() {
  const [records] = useState<BillingRow[]>([]);

  return (
    <ModuleTablePage
      title="Billing History"
      subtitle="Review historical billing records, invoices, and payment confirmations for your subscription."
      eyebrow="Licensing / Billing"
      icon="payroll"
      toolbarTitle="Billing ledger"
      toolbarSubtitle="Track all billing cycles, invoice amounts, and payment state for your ERP subscription."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} billing records`}
      emptyMessage="No billing records found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Invoices</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All billing entries</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Paid</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Paid").length}</p><p className="erp-kpi-meta">Cleared invoices</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending</p><p className="erp-kpi-value">{records.filter(r => r.status === "Pending").length}</p><p className="erp-kpi-meta">Outstanding</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Total Billed</p><p className="erp-kpi-value">{records.reduce((s, r) => s + r.amount, 0).toLocaleString()}</p><p className="erp-kpi-meta">Cumulative billing</p></div>
        </div>
      }
      columns={[
        { label: "Invoice #" },
        { label: "Period" },
        { label: "Plan" },
        { label: "Amount" },
        { label: "Paid Date" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900 font-mono text-xs">{r.invoiceNumber}</td>
          <td className="erp-td text-slate-600">{r.period}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-neutral">{r.plan}</span></td>
          <td className="erp-td text-slate-600">{r.amount.toLocaleString()}</td>
          <td className="erp-td text-slate-600">{r.paidDate || "-"}</td>
          <td className="erp-td"><span className={`erp-chip ${r.status === "Paid" ? "erp-chip-success" : "erp-chip-warning"}`}>{r.status}</span></td>
        </tr>
      )}
    />
  );
}
