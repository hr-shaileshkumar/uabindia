"use client";

import React, { useMemo, useState } from "react";
import { Menu, Layers } from "lucide-react";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { getApiErrorMessage } from "@/lib/api-errors";
import { flattenNavigationItems, useUiShellNavigation } from "@/features/platform/hooks/useUiShellNavigation";

export default function MenuBuilderPage() {
  const { data, isLoading, isError, error, refetch } = useUiShellNavigation();
  const [search, setSearch] = useState("");

  const items = useMemo(() => flattenNavigationItems(data), [data]);
  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    return !q || item.label.toLowerCase().includes(q) || item.href.toLowerCase().includes(q) || item.moduleKey.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Menu Items", value: items.length, tone: "info", icon: <Menu className="h-3.5 w-3.5" />, subtext: "UI Shell API" },
    { label: "Modules", value: new Set(items.map((i) => i.moduleKey)).size, tone: "positive", icon: <Layers className="h-3.5 w-3.5" />, subtext: "Navigation" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Menu Builder & Navigation Schema"
      subtitle="Read-only view of navigation items served by the UI shell schema API."
      categoryTag="Navigation Architecture"
      kpiMetrics={kpis}
      searchPlaceholder="Filter menu label, route, or module..."
      searchValue={search}
      onSearchChange={setSearch}
      onRefresh={() => void refetch()}
      isLoading={isLoading}
    >
      {isError && (
        <p className="px-4 py-3 text-xs text-rose-600 border-b border-[var(--border-subtle)]">
          {getApiErrorMessage(error, "Failed to load navigation schema.")}
        </p>
      )}
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Label</th>
              <th className="erp-th">Route</th>
              <th className="erp-th">Module</th>
              <th className="erp-th">Group</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="erp-td text-center py-8 text-xs text-muted-foreground">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="erp-td text-center py-8 text-xs text-muted-foreground">No navigation items returned by UI shell.</td></tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="erp-tr hover:bg-[var(--bg-muted)]/60">
                  <td className="erp-td text-xs font-semibold">{item.label}</td>
                  <td className="erp-td font-mono text-xs">{item.href}</td>
                  <td className="erp-td text-xs">{item.moduleKey}</td>
                  <td className="erp-td text-xs text-muted-foreground">{item.groupLabel}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
