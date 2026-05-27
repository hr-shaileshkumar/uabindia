"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type ApiKeyRow = { id: string; name: string; scope: string; createdAt: string; lastUsed: string; status: string };

export default function IntegrationsApiKeysPage() {
  const [records] = useState<ApiKeyRow[]>([]);

  return (
    <ModuleTablePage
      title="API Keys"
      subtitle="Create, rotate, and revoke API keys that grant external services access to the ERP platform."
      eyebrow="Integrations / API Keys"
      icon="key"
      toolbarTitle="API key management"
      toolbarSubtitle="Issue scoped keys to partner services and monitor usage."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} keys`}
      emptyMessage="No API keys found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Keys</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All keys</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Active</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Active").length}</p><p className="erp-kpi-meta">In use</p></div>
          <div className="erp-kpi-card erp-kpi-card-danger"><p className="erp-kpi-label">Revoked</p><p className="erp-kpi-value">{records.filter(r => r.status === "Revoked").length}</p><p className="erp-kpi-meta">Inactive</p></div>
        </div>
      }
      columns={[{ label: "Name" }, { label: "Scope" }, { label: "Created" }, { label: "Last Used" }, { label: "Status" }]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.name}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-neutral">{r.scope}</span></td>
          <td className="erp-td text-slate-600 text-xs">{r.createdAt}</td>
          <td className="erp-td text-slate-600 text-xs">{r.lastUsed || "Never"}</td>
          <td className="erp-td"><span className={`erp-chip ${r.status === "Active" ? "erp-chip-success" : "erp-chip-danger"}`}>{r.status}</span></td>
        </tr>
      )}
    />
  );
}
