"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type QuotationRow = {
  id: string;
  quoteNumber: string;
  customerName: string;
  amount: number;
  validUntil: string;
  status: string;
};

export default function QuotationsPage() {
  const [records] = useState<QuotationRow[]>([]);

  return (
    <ModuleTablePage
      title="Quotations"
      subtitle="Create and manage sales quotations, pricing proposals, and conversion to sales orders."
      eyebrow="Sales / Sales Process"
      icon="file"
      toolbarTitle="Quotation register"
      toolbarSubtitle="Track active quotations, customer proposals, and conversion pipeline to sales orders."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} quotations`}
      emptyMessage="No quotations found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All quotations</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Accepted</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Accepted").length}</p><p className="erp-kpi-meta">Converted to orders</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending</p><p className="erp-kpi-value">{records.filter(r => r.status === "Pending").length}</p><p className="erp-kpi-meta">Awaiting response</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Pipeline Value</p><p className="erp-kpi-value">{records.filter(r => r.status === "Pending").reduce((s, r) => s + r.amount, 0).toLocaleString()}</p><p className="erp-kpi-meta">Open quote value</p></div>
        </div>
      }
      columns={[
        { label: "Quote #" },
        { label: "Customer" },
        { label: "Amount" },
        { label: "Valid Until" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900 font-mono text-xs">{r.quoteNumber}</td>
          <td className="erp-td text-slate-600">{r.customerName}</td>
          <td className="erp-td text-slate-600">{r.amount.toLocaleString()}</td>
          <td className="erp-td text-slate-600">{r.validUntil}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-info">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
