"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { ListSearchInput } from "@/components/workspace/list-toolbar";
import { appApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";

type UsageRow = {
  id: string;
  moduleKey: string;
  moduleName: string;
  isEnabled?: boolean;
  activeUsers: number;
  apiCalls: number;
  storageUsedMb: number;
  period: string;
};

const asList = (raw: unknown): UsageRow[] => {
  if (Array.isArray(raw)) return raw as UsageRow[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as UsageRow[];
  }
  return [];
};

export default function LicensingUsagePage() {
  const [records, setRecords] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await appApi.licensing.usage();
      setRecords(asList(res.data));
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load usage"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => [r.moduleKey, r.moduleName].some((v) => (v || "").toLowerCase().includes(q)));
  }, [records, search]);

  const enabled = records.filter((r) => r.isEnabled);
  const period = records[0]?.period || new Date().toISOString().slice(0, 7);

  return (
    <ModuleTablePage
      title="Usage Analytics"
      subtitle="Monitor active users, API consumption, and document storage for the current billing period."
      eyebrow="Licensing / Billing"
      icon="dashboard"
      toolbarTitle="Usage dashboard"
      toolbarSubtitle={`Live tenant consumption for ${period}. Metrics come from users, audit activity, and documents.`}
      loading={loading}
      error={error}
      onRetry={load}
      rows={filtered}
      countLabel={(count) => `${count} modules tracked`}
      emptyMessage="No usage data available."
      filters={<ListSearchInput value={search} onChange={setSearch} placeholder="Filter module…" />}
      headerStats={
        <CrudHeaderStats
          items={[
            { label: "Enabled", value: enabled.length, helper: "modules" },
            {
              label: "Users",
              value: enabled.reduce((total, record) => Math.max(total, record.activeUsers), 0),
              helper: "active",
              tone: "info",
            },
            {
              label: "API calls",
              value: enabled.reduce((total, record) => Math.max(total, record.apiCalls), 0).toLocaleString(),
              helper: "period",
              tone: "warning",
            },
            {
              label: "Storage",
              value: `${enabled.reduce((total, record) => Math.max(total, record.storageUsedMb), 0).toLocaleString()} MB`,
              helper: "used",
              tone: "positive",
            },
          ]}
        />
      }
      columns={[
        { label: "Module" },
        { label: "Status" },
        { label: "Active users" },
        { label: "API calls" },
        { label: "Storage (MB)" },
        { label: "Period" },
      ]}
      renderRow={(r) => (
        <tr key={r.id || r.moduleKey} className="erp-tr">
          <td className="erp-td">
            <p className="font-semibold text-slate-900">{r.moduleName}</p>
            <p className="text-xs text-slate-500">{r.moduleKey}</p>
          </td>
          <td className="erp-td">
            <span className={r.isEnabled ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
              {r.isEnabled ? "Enabled" : "Off"}
            </span>
          </td>
          <td className="erp-td text-slate-600">{r.activeUsers}</td>
          <td className="erp-td text-slate-600">{r.apiCalls.toLocaleString()}</td>
          <td className="erp-td text-slate-600">{r.storageUsedMb.toLocaleString()}</td>
          <td className="erp-td text-slate-600">{r.period}</td>
        </tr>
      )}
    />
  );
}
