"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";


import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Plug, RefreshCw } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { ErpRefreshButton, ErpSearchFilter } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { erpButtonClassName } from "@/components/workspace/styles";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { mapIntegration, useIntegrationMutations, useIntegrations } from "@/features/administration/hooks/useIntegrations";

function LegacyIntegrationsAppsPage() {
  const { data = [], isLoading, isError, error, refetch } = useIntegrations();
  const { sync, testConnection } = useIntegrationMutations();
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const records = useMemo(() => data.map((item, index) => mapIntegration(item, index)), [data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter(
      (r) =>
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.provider.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
    );
  }, [records, search]);

  const onTest = async (id: string) => {
    try {
      setBusyId(id);
      const { data: res } = await testConnection.mutateAsync(id);
      const payload = res as { success?: boolean; message?: string };
      if (payload.success) notifySuccess(payload.message ?? "Connection test passed.");
      else notifyError(payload.message ?? "Connection test failed.");
      void refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Connection test failed."));
    } finally {
      setBusyId(null);
    }
  };

  const onSync = async (id: string) => {
    try {
      setBusyId(id);
      const { data: res } = await sync.mutateAsync(id);
      const payload = res as { success?: boolean; message?: string };
      if (payload.success) notifySuccess(payload.message ?? "Sync completed.");
      else notifyError(payload.message ?? "Sync failed.");
      void refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Sync failed."));
    } finally {
      setBusyId(null);
    }
  };

  const list = useErpListView({
    listKey: "integrations-apps",
    rows: filtered,
    columns: [
      { key: "name", label: "App", dataType: "string" },
      { key: "category", label: "Category", dataType: "string" },
      { key: "provider", label: "Provider", dataType: "string" },
      { key: "lastSyncAt", label: "Last sync", dataType: "string" },
      { key: "status", label: "Status", dataType: "string" },
      { key: "actions", label: "Actions", locked: true },
    ],
    getRowId: (row) => row.id,
    loading: isLoading,
    emptyMessage: "No connectors yet. Open Integration Hub to configure GST, bank, or biometric apps.",
    emptyAction: (
      <Link href="/platform/integrations" className={`${erpButtonClassName.primary} inline-flex h-8 items-center gap-1.5 px-3 text-xs`}>
        <Plug className="h-3.5 w-3.5" />
        Open Integration Hub
      </Link>
    ),
    onRefresh: () => void refetch(),
    renderRow: (r) => (
      <>
        <td className="erp-td font-semibold text-slate-900">{r.name}</td>
        <td className="erp-td">
          <span className="erp-chip erp-chip-neutral">{r.category}</span>
        </td>
        <td className="erp-td text-slate-600">{r.provider}</td>
        <td className="erp-td text-xs text-slate-600">
          {r.lastSyncAt ? new Date(r.lastSyncAt).toLocaleString("en-IN") : "Never"}
        </td>
        <td className="erp-td">
          <span
            className={`erp-chip ${
              r.status.toLowerCase() === "connected"
                ? "erp-chip-success"
                : r.status.toLowerCase() === "error"
                  ? "erp-chip-danger"
                  : "erp-chip-warning"
            }`}
          >
            {r.status}
          </span>
        </td>
        <td className="erp-td">
          <div className="flex flex-wrap items-center justify-end gap-1">
            <button
              type="button"
              className={`${erpButtonClassName.ghost} h-8 gap-1 px-2 text-xs`}
              disabled={busyId === r.id}
              onClick={() => void onTest(r.id)}
            >
              Test
            </button>
            <button
              type="button"
              className={`${erpButtonClassName.ghost} h-8 gap-1 px-2 text-xs`}
              disabled={busyId === r.id}
              onClick={() => void onSync(r.id)}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${busyId === r.id ? "animate-spin" : ""}`} />
              Sync
            </button>
            <Link
              href="/platform/integrations"
              className={`${erpButtonClassName.secondary} inline-flex h-8 items-center gap-1 px-2 text-xs`}
            >
              Connect <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </td>
      </>
    ),
  });

  return (
    <StandardPageLayout
      title="Connected Apps"
      subtitle="Configure external SaaS connectors, third-party syncs, and webhooks."
      eyebrow="Integrations / Ecosystem"
      icon="apps"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Apps", value: records.length, helper: "registered" },
            {
              label: "Connected",
              value: records.filter((r) => r.status.toLowerCase() === "connected").length,
              tone: "positive",
            },
            {
              label: "Error",
              value: records.filter((r) => r.status.toLowerCase() === "error").length,
              tone: "warning",
            },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void refetch()} loading={isLoading} />
          {list.headerTools}
          <Link
            href="/platform/integrations"
            className={`${erpButtonClassName.primary} inline-flex h-9 items-center gap-1.5 px-3 text-xs`}
          >
            <Plug className="h-3.5 w-3.5" />
            Integration Hub
          </Link>
        </>
      }
      filters={
        <>
          <ErpSearchFilter value={search} onChange={setSearch} placeholder="Filter app or provider…" />
          {list.filterBar}
        </>
      }
    >
      {isError ? (
        <div className="erp-alert-error">{getApiErrorMessage(error, "Failed to load connectors.")}</div>
      ) : null}
      <CrudCard>{list.table}</CrudCard>
    </StandardPageLayout>
  );
}

export default function IntegrationsAppsPage() {
  return (
    <DynamicPage
      pageKey="integrations.apps"
      fallback={<LegacyIntegrationsAppsPage />}
      renderMode="auto"
    />
  );
}
