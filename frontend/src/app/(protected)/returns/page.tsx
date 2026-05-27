"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type ReturnRow = {
  id: string;
  returnNumber: string;
  customerName: string;
  originalOrder: string;
  amount: number;
  reason: string;
  status: string;
};

export default function ReturnsPage() {
  const [records] = useState<ReturnRow[]>([]);

  return (
    <ModuleTablePage
      title="Returns"
      subtitle="Manage sales return requests, credit note generation, and reverse logistics."
      eyebrow="Sales / Sales Process"
      icon="file"
      toolbarTitle="Returns register"
      toolbarSubtitle="Process customer returns, issue credit notes, and track reverse fulfillment status."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} returns`}
      emptyMessage="No return records found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Returns</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All return requests</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Processed</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Processed").length}</p><p className="erp-kpi-meta">Credit note issued</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending</p><p className="erp-kpi-value">{records.filter(r => r.status === "Pending").length}</p><p className="erp-kpi-meta">Awaiting approval</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Return Value</p><p className="erp-kpi-value">{records.reduce((s, r) => s + r.amount, 0).toLocaleString()}</p><p className="erp-kpi-meta">Total returns value</p></div>
        </div>
      }
      columns={[
        { label: "Return #" },
        { label: "Customer" },
        { label: "Order Ref" },
        { label: "Amount" },
        { label: "Reason" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900 font-mono text-xs">{r.returnNumber}</td>
          <td className="erp-td text-slate-600">{r.customerName}</td>
          <td className="erp-td text-slate-600">{r.originalOrder}</td>
          <td className="erp-td text-slate-600">{r.amount.toLocaleString()}</td>
          <td className="erp-td text-slate-600">{r.reason}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-warning">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
