"use client";

import React, { useMemo, useState } from "react";
import { Code2, KeyRound, Plug, ExternalLink } from "lucide-react";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { getApiErrorMessage } from "@/lib/api-errors";
import { mapIntegration, useIntegrations } from "@/features/platform/hooks/useIntegrations";
import { mapApiKey, useApiKeys } from "@/features/platform/hooks/useApiKeys";

const swaggerUrl =
  (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/i, "") : "http://127.0.0.1:5000") +
  "/swagger";

export default function DeveloperCenterPage() {
  const integrationsQuery = useIntegrations();
  const apiKeysQuery = useApiKeys();
  const [search, setSearch] = useState("");

  const isLoading = integrationsQuery.isLoading || apiKeysQuery.isLoading;
  const isError = integrationsQuery.isError || apiKeysQuery.isError;
  const error = integrationsQuery.error ?? apiKeysQuery.error;

  const connectors = useMemo(
    () => (integrationsQuery.data ?? []).map((item, index) => mapIntegration(item, index)),
    [integrationsQuery.data]
  );
  const apiKeys = useMemo(
    () => (apiKeysQuery.data ?? []).map((item, index) => mapApiKey(item, index)),
    [apiKeysQuery.data]
  );

  const catalogRows = useMemo(
    () => [
      ...connectors.map((c) => ({ id: c.id, name: c.name, type: "Integration", status: c.status })),
      ...apiKeys.map((k) => ({ id: k.id, name: k.name, type: "API Key", status: k.status })),
    ],
    [apiKeys, connectors]
  );

  const filtered = catalogRows.filter((row) => {
    const q = search.toLowerCase();
    return !q || row.name.toLowerCase().includes(q) || row.type.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Integrations", value: connectors.length, tone: "info", icon: <Plug className="h-3.5 w-3.5" />, subtext: "Live API" },
    { label: "API Keys", value: apiKeys.length, tone: "warning", icon: <KeyRound className="h-3.5 w-3.5" />, subtext: "Live API" },
    { label: "OpenAPI", value: "Swagger", tone: "positive", icon: <Code2 className="h-3.5 w-3.5" />, subtext: "Explorer" },
  ];

  const refetch = () => {
    void integrationsQuery.refetch();
    void apiKeysQuery.refetch();
  };

  return (
    <PlatformGlobalPageShell
      title="Developer Center & API Explorer"
      subtitle="Integration registry, API keys, and OpenAPI explorer entry points."
      categoryTag="Developer Platform"
      kpiMetrics={kpis}
      searchPlaceholder="Filter integration or key..."
      searchValue={search}
      onSearchChange={setSearch}
      onRefresh={refetch}
      isLoading={isLoading}
      secondaryActions={[
        {
          label: "Open Swagger UI",
          icon: <ExternalLink className="h-3.5 w-3.5" />,
          onClick: () => window.open(swaggerUrl, "_blank", "noopener,noreferrer"),
        },
      ]}
    >
      {isError && (
        <p className="px-4 py-3 text-xs text-rose-600 border-b border-[var(--border-subtle)]">
          {getApiErrorMessage(error, "Failed to load developer catalog.")}
        </p>
      )}
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Resource</th>
              <th className="erp-th">Type</th>
              <th className="erp-th">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={3} className="erp-td text-center py-8 text-xs text-muted-foreground">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={3} className="erp-td text-center py-8 text-xs text-muted-foreground">No developer resources configured yet.</td></tr>
            ) : (
              filtered.map((row) => (
                <tr key={`${row.type}-${row.id}`} className="erp-tr">
                  <td className="erp-td"><div className="erp-row-title">{row.name}</div></td>
                  <td className="erp-td"><span className="erp-chip">{row.type}</span></td>
                  <td className="erp-td"><span className="erp-chip erp-chip-neutral">{row.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
