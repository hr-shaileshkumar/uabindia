"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type PurchaseRequestRow = {
  id: string;
  requestNumber: string;
  requestedBy: string;
  itemDescription: string;
  quantity: number;
  estimatedCost: number;
  status: string;
};

export default function PurchaseRequestsPage() {
  const [records] = useState<PurchaseRequestRow[]>([]);

  return (
    <ModuleTablePage
      title="Purchase Requests"
      subtitle="Raise and track internal purchase requests before converting them to purchase orders."
      eyebrow="Procurement / Ordering"
      icon="file"
      toolbarTitle="Purchase request register"
      toolbarSubtitle="Monitor purchase request approvals and conversion pipeline to purchase orders."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} requests`}
      emptyMessage="No purchase requests found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All PRs</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Approved</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Approved").length}</p><p className="erp-kpi-meta">Ready to order</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending</p><p className="erp-kpi-value">{records.filter(r => r.status === "Pending").length}</p><p className="erp-kpi-meta">Under review</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Est. Value</p><p className="erp-kpi-value">{records.reduce((s, r) => s + r.estimatedCost, 0).toLocaleString()}</p><p className="erp-kpi-meta">Total estimated cost</p></div>
        </div>
      }
      columns={[
        { label: "PR Number" },
        { label: "Requested By" },
        { label: "Item" },
        { label: "Qty" },
        { label: "Est. Cost" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900 font-mono text-xs">{r.requestNumber}</td>
          <td className="erp-td text-slate-600">{r.requestedBy}</td>
          <td className="erp-td text-slate-600">{r.itemDescription}</td>
          <td className="erp-td text-slate-600">{r.quantity}</td>
          <td className="erp-td text-slate-600">{r.estimatedCost.toLocaleString()}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-info">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
