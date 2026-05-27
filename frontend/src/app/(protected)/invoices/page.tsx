"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  dueDate: string;
  status: string;
};

export default function InvoicesPage() {
  const [records] = useState<InvoiceRow[]>([]);

  return (
    <ModuleTablePage
      title="Invoices"
      subtitle="Manage customer invoices, billing cycles, and payment reconciliation."
      eyebrow="Finance / Transactions"
      icon="file"
      toolbarTitle="Invoice register"
      toolbarSubtitle="Track outstanding, paid, and overdue invoices across all customers and billing entities."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} invoices`}
      emptyMessage="No invoices found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All invoices</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Paid</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Paid").length}</p><p className="erp-kpi-meta">Cleared invoices</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Outstanding</p><p className="erp-kpi-value">{records.filter(r => r.status === "Outstanding").length}</p><p className="erp-kpi-meta">Awaiting payment</p></div>
          <div className="erp-kpi-card erp-kpi-card-danger"><p className="erp-kpi-label">Overdue</p><p className="erp-kpi-value">{records.filter(r => r.status === "Overdue").length}</p><p className="erp-kpi-meta">Past due date</p></div>
        </div>
      }
      columns={[
        { label: "Invoice #" },
        { label: "Customer" },
        { label: "Amount" },
        { label: "Due Date" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900 font-mono text-xs">{r.invoiceNumber}</td>
          <td className="erp-td text-slate-600">{r.customerName}</td>
          <td className="erp-td text-slate-600">{r.amount.toLocaleString()}</td>
          <td className="erp-td text-slate-600">{r.dueDate}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-info">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
