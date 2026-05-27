"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type TransferRow = {
  id: string;
  transferNumber: string;
  fromWarehouse: string;
  toWarehouse: string;
  itemName: string;
  quantity: number;
  transferDate: string;
  status: string;
};

export default function InventoryTransfersPage() {
  const [records] = useState<TransferRow[]>([]);

  return (
    <ModuleTablePage
      title="Inventory Transfers"
      subtitle="Transfer stock between warehouses, branches, and storage locations."
      eyebrow="Inventory / Transactions"
      icon="box"
      toolbarTitle="Transfer register"
      toolbarSubtitle="Track inter-warehouse stock movements, transit state, and receiving confirmations."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} transfers`}
      emptyMessage="No inventory transfers found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All transfers</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Completed</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Completed").length}</p><p className="erp-kpi-meta">Received at destination</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">In Transit</p><p className="erp-kpi-value">{records.filter(r => r.status === "InTransit").length}</p><p className="erp-kpi-meta">En route</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Pending</p><p className="erp-kpi-value">{records.filter(r => r.status === "Pending").length}</p><p className="erp-kpi-meta">Not dispatched yet</p></div>
        </div>
      }
      columns={[
        { label: "Transfer #" },
        { label: "From" },
        { label: "To" },
        { label: "Item" },
        { label: "Qty" },
        { label: "Date" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900 font-mono text-xs">{r.transferNumber}</td>
          <td className="erp-td text-slate-600">{r.fromWarehouse}</td>
          <td className="erp-td text-slate-600">{r.toWarehouse}</td>
          <td className="erp-td text-slate-600">{r.itemName}</td>
          <td className="erp-td text-slate-600">{r.quantity}</td>
          <td className="erp-td text-slate-600">{r.transferDate}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-info">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
