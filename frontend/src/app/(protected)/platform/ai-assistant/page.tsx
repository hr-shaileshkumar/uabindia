"use client";

import React, { useMemo, useState } from "react";
import { Bot, Sparkles, ToggleLeft } from "lucide-react";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { getApiErrorMessage } from "@/lib/api-errors";
import { mapAiAgent, useAiAgents } from "@/features/platform/hooks/useAiAgents";

export default function AiAssistantPage() {
  const { data, isLoading, isError, error, refetch } = useAiAgents(1, 50);
  const [search, setSearch] = useState("");

  const agents = useMemo(() => (data?.data ?? []).map(mapAiAgent), [data?.data]);
  const filtered = agents.filter((row) => {
    const q = search.toLowerCase();
    return !q || row.name.toLowerCase().includes(q) || row.key.toLowerCase().includes(q) || row.category.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Agents", value: data?.total ?? agents.length, tone: "info", icon: <Bot className="h-3.5 w-3.5" />, subtext: "Live API" },
    { label: "Enabled", value: agents.filter((a) => a.status === "Enabled").length, tone: "positive", icon: <Sparkles className="h-3.5 w-3.5" />, subtext: "Active" },
    { label: "Categories", value: new Set(agents.map((a) => a.category)).size, tone: "warning", icon: <ToggleLeft className="h-3.5 w-3.5" />, subtext: "Scopes" },
  ];

  return (
    <PlatformGlobalPageShell
      title="AI Assistant & Agent Orchestration"
      subtitle="Configure ERP copilots and automated agent workflows."
      categoryTag="AI Platform"
      kpiMetrics={kpis}
      searchPlaceholder="Filter agent name, key, or category..."
      searchValue={search}
      onSearchChange={setSearch}
      onRefresh={() => void refetch()}
      isLoading={isLoading}
    >
      {isError && (
        <p className="px-4 py-3 text-xs text-rose-600 border-b border-[var(--border-subtle)]">
          {getApiErrorMessage(error, "Failed to load AI agents.")}
        </p>
      )}
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Agent</th>
              <th className="erp-th">Provider / Model</th>
              <th className="erp-th">Category</th>
              <th className="erp-th">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="erp-td text-center py-8 text-xs text-muted-foreground">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="erp-td text-center py-8 text-xs text-muted-foreground">No AI agents configured yet.</td></tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="erp-tr">
                  <td className="erp-td"><div className="erp-row-title">{row.name}</div><div className="erp-row-meta">{row.key}</div></td>
                  <td className="erp-td text-xs text-slate-500">{row.provider} · {row.model}</td>
                  <td className="erp-td"><span className="erp-chip">{row.category}</span></td>
                  <td className="erp-td"><span className={row.status === "Enabled" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>{row.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
