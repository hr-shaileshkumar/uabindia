"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";

type WebhookRow = { id: string; url: string; events: string; deliveries: number; failures: number; status: string };

export default function IntegrationsWebhooksPage() {
  const [records] = useState<WebhookRow[]>([]);

  return (
    <ModuleTablePage
      title="Webhooks"
      subtitle="Configure outbound webhook endpoints to stream real-time ERP events to external systems."
      eyebrow="Integrations / Webhooks"
      icon="link"
      toolbarTitle="Webhook endpoints"
      toolbarSubtitle="Monitor delivery success rates and configure retry policies for webhook events."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} webhooks`}
      emptyMessage="No webhooks configured."
      headerStats={
        <CrudHeaderStats
          items={[
            { label: "Webhooks", value: records.length, helper: "total" },
            { label: "Active", value: records.filter((r) => r.status === "Active").length, tone: "positive" },
            { label: "Failures", value: records.reduce((a, r) => a + r.failures, 0), tone: "danger" },
          ]}
        />
      }
      columns={[{ label: "Endpoint URL" }, { label: "Events" }, { label: "Deliveries" }, { label: "Failures" }, { label: "Status" }]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900 font-mono text-xs">{r.url}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-neutral">{r.events}</span></td>
          <td className="erp-td text-slate-600">{r.deliveries}</td>
          <td className="erp-td text-slate-600">{r.failures}</td>
          <td className="erp-td"><span className={`erp-chip ${r.status === "Active" ? "erp-chip-success" : "erp-chip-danger"}`}>{r.status}</span></td>
        </tr>
      )}
    />
  );
}
