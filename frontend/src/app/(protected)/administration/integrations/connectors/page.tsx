"use client";

import React, { useMemo, useState } from "react";
import { Plug, CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";
import { AdministrationGlobalPageShell, KpiMetricItem } from "@/components/administration/AdministrationGlobalPageShell";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { erpButtonClassName } from "@/components/workspace/styles";
import {
  mapIntegration,
  useIntegrationMutations,
  useIntegrations,
} from "@/features/administration/hooks/useIntegrations";
import Link from "next/link";

export default function ConnectorsPage() {
  const { data = [], isLoading, isError, error, refetch } = useIntegrations();
  const { sync } = useIntegrationMutations();
  const [search, setSearch] = useState("");

  const connectors = useMemo(() => data.map((item, index) => mapIntegration(item, index)), [data]);
  const filtered = connectors.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.provider.toLowerCase().includes(q) ||
      c.connectorKey.toLowerCase().includes(q)
    );
  });

  const kpis: KpiMetricItem[] = [
    { label: "Connectors", value: connectors.length, tone: "info", icon: <Plug className="h-3.5 w-3.5" />, subtext: "Live API" },
    {
      label: "Connected",
      value: connectors.filter((c) => c.status.toLowerCase() === "connected").length,
      tone: "positive",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      subtext: "Ready",
    },
  ];

  const onSync = async (id: string) => {
    try {
      const { data: res } = await sync.mutateAsync(id);
      const payload = res as { success?: boolean; message?: string };
      if (payload.success) notifySuccess(payload.message ?? "Sync completed.");
      else notifyError(payload.message ?? "Sync failed.");
      void refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Sync failed."));
    }
  };

  return (
    <AdministrationGlobalPageShell
      title="Connectors"
      icon="link"
      kpiMetrics={kpis}
      searchPlaceholder="Filter connector or provider..."
      searchValue={search}
      onSearchChange={setSearch}
      onRefresh={() => void refetch()}
      isLoading={isLoading}
      listKey="platform-connectors"
      listRows={filtered}
      listColumns={[
        { key: "name", label: "Connector" },
        { key: "provider", label: "Provider" },
        { key: "category", label: "Category" },
        { key: "status", label: "Status" },
        { key: "actions", label: "Actions", locked: true },
      ]}
      getRowId={(row) => row.id}
      emptyMessage="No integrations configured yet. Restart the API to seed demo connectors."
      renderListRow={(c) => (
        <tr key={c.id} className="erp-tr">
          <td className="erp-td font-semibold text-slate-900">{c.name}</td>
          <td className="erp-td">{c.provider}</td>
          <td className="erp-td">{c.category}</td>
          <td className="erp-td">
            <span className={c.status.toLowerCase() === "connected" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>{c.status}</span>
          </td>
          <td className="erp-td">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`${erpButtonClassName.ghost} h-8 gap-1 px-2 text-xs`}
                disabled={sync.isPending}
                onClick={() => void onSync(c.id)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Sync
              </button>
              <Link
                href="/platform/integrations"
                className={`${erpButtonClassName.secondary} inline-flex h-8 items-center gap-1 px-2 text-xs`}
              >
                Configure <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </td>
        </tr>
      )}
    >
      {isError ? (
        <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load integrations.")}</div>
      ) : null}
    </AdministrationGlobalPageShell>
  );
}
