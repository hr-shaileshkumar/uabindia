"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { ListSearchInput } from "@/components/erp/list-toolbar";
import { erpButtonClassName } from "@/components/erp/erpStyles";
import { getApiErrorMessage } from "@/lib/api-errors";
import { mapIntegration, useIntegrations } from "@/features/platform/hooks/useIntegrations";

export default function IntegrationsWebhooksPage() {
  const { data = [], isLoading, isError, error, refetch } = useIntegrations();
  const [search, setSearch] = useState("");
  const records = useMemo(() => data.map((item, index) => mapIntegration(item, index)), [data]);
  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.name.toLowerCase().includes(q) || r.connectorKey.toLowerCase().includes(q);
  });

  return (
    <ModuleTablePage
      title="Webhooks"
      subtitle="Outbound connector event sources. Dedicated webhook URLs are not a separate entity yet — sync logs act as delivery history."
      eyebrow="Integrations / Webhooks"
      icon="link"
      toolbarTitle="Event sources"
      toolbarSubtitle="Each connector can emit TestConnection / Sync events. Configure in Integration Hub."
      loading={isLoading}
      loadError={isError ? getApiErrorMessage(error, "Failed to load webhook sources.") : null}
      onRetry={() => void refetch()}
      rows={filtered}
      countLabel={(count) => `${count} sources`}
      emptyMessage="No connector event sources yet."
      emptyAction={
        <Link href="/platform/integrations" className={`${erpButtonClassName.primary} inline-flex h-8 items-center px-3 text-xs`}>
          Open Integration Hub
        </Link>
      }
      filters={<ListSearchInput value={search} onChange={setSearch} placeholder="Filter source…" />}
      actions={
        <Link href="/integrations/logs" className={`${erpButtonClassName.secondary} inline-flex h-9 items-center px-3 text-xs`}>
          View deliveries
        </Link>
      }
      headerStats={
        <CrudHeaderStats
          items={[
            { label: "Sources", value: records.length, helper: "connectors" },
            { label: "Connected", value: records.filter((r) => r.status.toLowerCase() === "connected").length, tone: "positive" },
            { label: "Errors", value: records.filter((r) => r.status.toLowerCase() === "error").length, tone: "danger" },
          ]}
        />
      }
      columns={[{ label: "Source" }, { label: "Events" }, { label: "Last delivery" }, { label: "Status" }]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900 font-mono text-xs">{r.connectorKey || r.name}</td>
          <td className="erp-td">
            <span className="erp-chip erp-chip-neutral">TestConnection, Sync</span>
          </td>
          <td className="erp-td text-slate-600 text-xs">{r.lastSyncAt ? new Date(r.lastSyncAt).toLocaleString() : r.lastTestedAt ? new Date(r.lastTestedAt).toLocaleString() : "—"}</td>
          <td className="erp-td">
            <span className={`erp-chip ${r.status.toLowerCase() === "connected" ? "erp-chip-success" : "erp-chip-warning"}`}>{r.status}</span>
          </td>
        </tr>
      )}
    />
  );
}
