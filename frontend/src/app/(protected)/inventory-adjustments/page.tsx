"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type AdjustmentRow = {
  id: string;
  referenceNumber: string;
  itemName: string;
  warehouseName: string;
  quantity: number;
  adjustmentType: string;
  reason: string;
  status: string;
};

export default function InventoryAdjustmentsPage() {
  const [records] = useState<AdjustmentRow[]>([]);

  return (
    <ModuleTablePage
      title="Inventory Adjustments"
      subtitle="Record stock adjustments for write-offs, damage, physical count corrections, and audits."
      eyebrow="Inventory / Transactions"
      icon="box"
      toolbarTitle="Adjustment register"
      toolbarSubtitle="Review and process inventory quantity corrections with reason codes and approval state."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} adjustments`}
      emptyMessage="No inventory adjustments found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All adjustments</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Approved</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Approved").length}</p><p className="erp-kpi-meta">Applied to stock</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending</p><p className="erp-kpi-value">{records.filter(r => r.status === "Pending").length}</p><p className="erp-kpi-meta">Awaiting approval</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Write-offs</p><p className="erp-kpi-value">{records.filter(r => r.adjustmentType === "WriteOff").length}</p><p className="erp-kpi-meta">Stock written off</p></div>
        </div>
      }
      columns={[
        { label: "Reference" },
        { label: "Item" },
        { label: "Warehouse" },
        { label: "Quantity" },
        { label: "Type" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900 font-mono text-xs">{r.referenceNumber}</td>
          <td className="erp-td text-slate-600">{r.itemName}</td>
          <td className="erp-td text-slate-600">{r.warehouseName}</td>
          <td className={`erp-td font-medium ${r.quantity < 0 ? "text-red-600" : "text-green-600"}`}>{r.quantity > 0 ? `+${r.quantity}` : r.quantity}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-neutral">{r.adjustmentType}</span></td>
          <td className="erp-td"><span className="erp-chip erp-chip-info">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
