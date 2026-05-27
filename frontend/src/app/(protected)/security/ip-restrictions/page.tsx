"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type IpRestrictionRow = {
  id: string;
  label: string;
  ipRange: string;
  type: "Allow" | "Block";
  appliesTo: string;
  createdAt: string;
  status: string;
};

export default function IpRestrictionsPage() {
  const [records] = useState<IpRestrictionRow[]>([]);

  return (
    <ModuleTablePage
      title="IP Restrictions"
      subtitle="Define allowed and blocked IP ranges to restrict ERP access by network location."
      eyebrow="Security / Policies"
      icon="shield"
      toolbarTitle="IP restriction rules"
      toolbarSubtitle="Manage network-level access rules by defining IP allowlists and blocklists."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} rules`}
      emptyMessage="No IP restriction rules configured."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Rules</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All IP rules</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Allow Rules</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.type === "Allow").length}</p><p className="erp-kpi-meta">Permitted ranges</p></div>
          <div className="erp-kpi-card erp-kpi-card-danger"><p className="erp-kpi-label">Block Rules</p><p className="erp-kpi-value">{records.filter(r => r.type === "Block").length}</p><p className="erp-kpi-meta">Restricted ranges</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Active</p><p className="erp-kpi-value">{records.filter(r => r.status === "Active").length}</p><p className="erp-kpi-meta">Enforced rules</p></div>
        </div>
      }
      columns={[
        { label: "Label" },
        { label: "IP Range" },
        { label: "Type" },
        { label: "Applies To" },
        { label: "Created" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.label}</td>
          <td className="erp-td font-mono text-xs text-slate-600">{r.ipRange}</td>
          <td className="erp-td"><span className={`erp-chip ${r.type === "Allow" ? "erp-chip-success" : "erp-chip-danger"}`}>{r.type}</span></td>
          <td className="erp-td text-slate-600">{r.appliesTo}</td>
          <td className="erp-td text-slate-600">{r.createdAt}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-info">{r.status}</span></td>
        </tr>
      )}
    />
  );
}
