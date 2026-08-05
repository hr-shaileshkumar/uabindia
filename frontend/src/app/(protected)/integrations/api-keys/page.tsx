"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";

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
      headerStats={
        <CrudHeaderStats
          items={[
            { label: "Keys", value: records.length, helper: "total" },
            { label: "Active", value: records.filter((r) => r.status === "Active").length, tone: "positive" },
            { label: "Revoked", value: records.filter((r) => r.status === "Revoked").length, tone: "danger" },
          ]}
        />
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
