"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type GrnRow = {
  id: string;
  grnNumber: string;
  vendorName: string;
  poReference: string;
  receivedDate: string;
  totalItems: number;
  status: string;
};

export default function GoodsReceiptPage() {
  const [records] = useState<GrnRow[]>([]);

  return (
    <ModuleTablePage
      title="Goods Receipt (GRN)"
      subtitle="Record and verify goods received against purchase orders before inventory update."
      eyebrow="Procurement / Receiving"
      icon="box"
      toolbarTitle="GRN register"
      toolbarSubtitle="Track goods receipt notes, vendor deliveries, and quality verification status."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} GRNs`}
      emptyMessage="No goods receipt notes found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total GRNs</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All receipts</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Accepted</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Accepted").length}</p><p className="erp-kpi-meta">Quality passed</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending QC</p><p className="erp-kpi-value">{records.filter(r => r.status === "PendingQC").length}</p><p className="erp-kpi-meta">Under inspection</p></div>
          <div className="erp-kpi-card erp-kpi-card-danger"><p className="erp-kpi-label">Rejected</p><p className="erp-kpi-value">{records.filter(r => r.status === "Rejected").length}</p><p className="erp-kpi-meta">Failed quality check</p></div>
        </div>
      }
      columns={[
        { label: "GRN #" },
        { label: "Vendor" },
        { label: "PO Reference" },
        { label: "Received Date" },
        { label: "Items" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900 font-mono text-xs">{r.grnNumber}</td>
          <td className="erp-td text-slate-600">{r.vendorName}</td>
          <td className="erp-td text-slate-600">{r.poReference}</td>
          <td className="erp-td text-slate-600">{r.receivedDate}</td>
          <td className="erp-td text-slate-600">{r.totalItems}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-info">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
