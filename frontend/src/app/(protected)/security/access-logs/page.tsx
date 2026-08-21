"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import { useErpListView } from "@/components/erp/erp-list-view";
import { platformApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import { ROUTES } from "@/constants/routes";

type AuditRow = {
  id: string;
  entityName: string;
  entityId?: string | null;
  action: string;
  performedAt: string;
  performedBy?: string | null;
  ip?: string | null;
};

export default function AccessLogsPage() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await platformApi.admin.auditLogs({ page: 1, limit: 50 });
        const data = (res.data || {}) as { logs?: AuditRow[] };
        setLogs(data.logs ?? []);
      } catch (err) {
        setLogs([]);
        setError(getApiErrorMessage(err, "Failed to load access events."));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const authEvents = useMemo(
    () =>
      logs.filter((log) => {
        const haystack = `${log.entityName} ${log.action}`.toLowerCase();
        return haystack.includes("auth") || haystack.includes("login") || haystack.includes("session") || haystack.includes("user");
      }),
    [logs],
  );

  const rows = authEvents.length > 0 ? authEvents : logs;

  const list = useErpListView({
    listKey: "security-access-logs",
    rows,
    columns: [
      { key: "performedBy", label: "User" },
      { key: "action", label: "Action" },
      { key: "entityName", label: "Entity" },
      { key: "ip", label: "IP" },
      { key: "performedAt", label: "Timestamp", dataType: "date" },
    ],
    getRowId: (row) => row.id,
    loading,
    emptyMessage: "No access log events found. Dedicated login telemetry is not available yet.",
    renderRow: (row) => (
      <tr key={row.id} className="erp-tr">
        <td className="erp-td font-medium text-slate-900">{row.performedBy || "—"}</td>
        <td className="erp-td">{row.action}</td>
        <td className="erp-td">{row.entityName}</td>
        <td className="erp-td font-mono text-xs">{row.ip || "—"}</td>
        <td className="erp-td text-xs">{row.performedAt ? new Date(row.performedAt).toLocaleString() : "—"}</td>
      </tr>
    ),
  });

  return (
    <StandardPageLayout
      title="Access logs"
      icon="file"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Events", value: loading ? "…" : rows.length, helper: "shown" },
            { label: "Auth-related", value: loading ? "…" : authEvents.length, tone: "info" },
          ]}
        />
      }
      actions={
        <>
          {list.headerTools}
          <Link href={ROUTES.AUDIT_LOGS} className="erp-action-btn erp-action-btn-secondary text-xs">
            Open audit logs
          </Link>
        </>
      }
      filters={list.filterBar}
    >
      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <CrudCard>{list.table}</CrudCard>
    </StandardPageLayout>
  );
}
