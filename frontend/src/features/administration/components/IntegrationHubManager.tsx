"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, RefreshCw, PlugZap, ScrollText } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { ErpRefreshButton } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { SideDrawer } from "@/components/ui/side-drawer";
import { erpButtonClassName, erpFormInputClassName } from "@/components/workspace/styles";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import {
  connectorConfigFields,
  mapIntegration,
  useIntegrationDetail,
  useIntegrationLogs,
  useIntegrationMutations,
  useIntegrations,
} from "@/features/administration/hooks/useIntegrations";

export function IntegrationHubManager() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const { data = [], isLoading, isError, error, refetch } = useIntegrations();
  const { data: detail } = useIntegrationDetail(selectedId);
  const { data: logs = [], refetch: refetchLogs } = useIntegrationLogs(showLogs ? selectedId : null);
  const { saveConfig, testConnection, sync } = useIntegrationMutations();

  const connectors = useMemo(() => data.map((item, index) => mapIntegration(item, index)), [data]);

  const filtered = connectors.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.provider.toLowerCase().includes(search.toLowerCase()) ||
      c.connectorKey.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = connectors.filter(
    (c) => c.status.toLowerCase() === "active" || c.status.toLowerCase() === "connected"
  ).length;

  const selected = connectors.find((c) => c.id === selectedId) ?? null;
  const fields = connectorConfigFields(detail?.connectorKey ?? selected?.connectorKey ?? "");

  useEffect(() => {
    if (!detail?.config) {
      setForm({});
      return;
    }
    const next: Record<string, string> = {};
    for (const [k, v] of Object.entries(detail.config)) {
      next[k] = v ?? "";
    }
    setForm(next);
  }, [detail]);

  const busy = saveConfig.isPending || testConnection.isPending || sync.isPending;

  const onSave = async () => {
    if (!selectedId) return;
    try {
      await saveConfig.mutateAsync({ id: selectedId, config: form });
      notifySuccess("Connector configuration saved.");
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save configuration."));
    }
  };

  const onTest = async () => {
    if (!selectedId) return;
    try {
      const { data: res } = await testConnection.mutateAsync(selectedId);
      const payload = res as { success?: boolean; message?: string };
      if (payload.success) notifySuccess(payload.message ?? "Connection test passed.");
      else notifyError(payload.message ?? "Connection test failed.");
      void refetchLogs();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Connection test failed."));
    }
  };

  const onSync = async (id: string) => {
    try {
      const { data: res } = await sync.mutateAsync(id);
      const payload = res as { success?: boolean; message?: string };
      if (payload.success) notifySuccess(payload.message ?? "Sync completed.");
      else notifyError(payload.message ?? "Sync failed.");
      if (selectedId === id) void refetchLogs();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Sync failed."));
    }
  };

  const list = useErpListView({
    listKey: "platform-integration-hub",
    rows: filtered,
    columns: [
      { key: "name", label: "Connector" },
      { key: "provider", label: "Provider" },
      { key: "category", label: "Category" },
      { key: "status", label: "Status" },
      { key: "lastSyncAt", label: "Last sync", dataType: "date" },
      { key: "actions", label: "Actions", locked: true },
    ],
    getRowId: (row) => row.id,
    loading: isLoading,
    emptyMessage: "No integrations configured. Restart the API so demo connectors can seed for this tenant.",
    onRefresh: () => void refetch(),
    extraFilters: (
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search integration or provider…"
        className="erp-input h-8 w-56 sm:w-64"
      />
    ),
    renderRow: (conn) => (
      <tr key={conn.id} className="erp-tr">
        <td className="erp-td font-semibold text-slate-900">{conn.name}</td>
        <td className="erp-td">{conn.provider}</td>
        <td className="erp-td">{conn.category}</td>
        <td className="erp-td">
          <span className={conn.status.toLowerCase() === "connected" || conn.status.toLowerCase() === "active" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
            {conn.status}
          </span>
        </td>
        <td className="erp-td text-xs text-slate-500">{conn.lastSyncAt ? new Date(conn.lastSyncAt).toLocaleString() : "—"}</td>
        <td className="erp-td">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={`${erpButtonClassName.ghost} h-8 gap-1 px-2 text-xs`} disabled={busy} onClick={() => void onSync(conn.id)}>
              <RefreshCw className="h-3.5 w-3.5" /> Re-sync
            </button>
            <button
              type="button"
              className={`${erpButtonClassName.secondary} h-8 gap-1 px-2 text-xs`}
              onClick={() => {
                setSelectedId(conn.id);
                setShowLogs(false);
              }}
            >
              Configure <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </td>
      </tr>
    ),
  });

  return (
    <StandardPageLayout
      title="Integration Hub & API Gateway"
      subtitle="Configure GST, bank feed, and biometric connectors with test + sync logs."
      eyebrow="Platform"
      icon="link"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Connectors", value: connectors.length, helper: "registered" },
            { label: "Connected", value: activeCount, tone: "positive" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void refetch()} loading={isLoading} />
          {list.headerTools}
        </>
      }
      filters={list.filterBar}
    >
      {isError ? (
        <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load integrations.")}</div>
      ) : null}

      <CrudCard>{list.table}</CrudCard>

      <SideDrawer
        open={Boolean(selectedId)}
        onClose={() => {
          setSelectedId(null);
          setShowLogs(false);
        }}
        title={selected ? selected.name : "Connector"}
        subtitle={selected ? `${selected.provider} · ${selected.connectorKey}` : undefined}
        width="lg"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className={erpButtonClassName.ghost}
              onClick={() => {
                setShowLogs((v) => !v);
                if (!showLogs) void refetchLogs();
              }}
            >
              <ScrollText className="mr-1 inline h-3.5 w-3.5" />
              {showLogs ? "Hide logs" : "Sync logs"}
            </button>
            <button type="button" className={erpButtonClassName.secondary} disabled={busy} onClick={() => void onTest()}>
              <PlugZap className="mr-1 inline h-3.5 w-3.5" />
              Test
            </button>
            <button type="button" className={erpButtonClassName.primary} disabled={busy} onClick={() => void onSave()}>
              Save
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {selected?.lastError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{selected.lastError}</p>
          ) : null}

          {fields.map((field) => (
            <label key={field.key} className="block space-y-1">
              <span className="text-xs font-medium text-slate-600">{field.label}</span>
              <input
                type={field.secret ? "password" : "text"}
                className={erpFormInputClassName}
                placeholder={field.placeholder}
                value={form[field.key] ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                autoComplete="off"
              />
            </label>
          ))}

          {showLogs ? (
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent logs</p>
              {logs.length === 0 ? (
                <p className="text-xs text-slate-500">No sync logs yet. Run Test or Re-sync.</p>
              ) : (
                <ul className="max-h-64 space-y-2 overflow-y-auto">
                  {logs.map((log) => (
                    <li key={log.id} className="rounded-md border border-slate-100 px-3 py-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{log.operation}</span>
                        <span className={log.status?.toLowerCase() === "success" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-danger"}>
                          {log.status ?? "—"}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-600">{log.message}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {log.startedAt ? new Date(log.startedAt).toLocaleString() : ""} · {log.recordsProcessed ?? 0} records
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}
