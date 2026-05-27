"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

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
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">Webhooks</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Active</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Active").length}</p><p className="erp-kpi-meta">Delivering</p></div>
          <div className="erp-kpi-card erp-kpi-card-danger"><p className="erp-kpi-label">Failures</p><p className="erp-kpi-value">{records.reduce((a, r) => a + r.failures, 0)}</p><p className="erp-kpi-meta">Total failed</p></div>
        </div>
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
