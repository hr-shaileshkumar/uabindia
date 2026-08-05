"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";

type AppRow = { id: string; name: string; category: string; provider: string; connectedAt: string; status: string };

export default function IntegrationsAppsPage() {
  const [records] = useState<AppRow[]>([]);

  return (
    <ModuleTablePage
      title="Connected Apps"
      subtitle="Manage third-party app integrations, OAuth 2.0 permissions, and marketplace connections."
      eyebrow="Integrations / Apps"
      icon="apps"
      toolbarTitle="App marketplace"
      toolbarSubtitle="Connect your ERP with CRMs, accounting tools, HR platforms, and more."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} apps`}
      emptyMessage="No connected apps."
      headerStats={
        <CrudHeaderStats
          items={[
            { label: "Apps", value: records.length, helper: "connected" },
            { label: "Active", value: records.filter((r) => r.status === "Connected").length, tone: "positive" },
            { label: "Error", value: records.filter((r) => r.status === "Error").length, tone: "warning" },
          ]}
        />
      }
      columns={[{ label: "App" }, { label: "Category" }, { label: "Provider" }, { label: "Connected" }, { label: "Status" }]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.name}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-neutral">{r.category}</span></td>
          <td className="erp-td text-slate-600">{r.provider}</td>
          <td className="erp-td text-slate-600 text-xs">{r.connectedAt}</td>
          <td className="erp-td"><span className={`erp-chip ${r.status === "Connected" ? "erp-chip-success" : r.status === "Error" ? "erp-chip-danger" : "erp-chip-warning"}`}>{r.status}</span></td>
        </tr>
      )}
    />
  );
}
