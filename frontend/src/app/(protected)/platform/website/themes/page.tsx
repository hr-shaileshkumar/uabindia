"use client";

import React, { useMemo, useState } from "react";
import { Globe, Palette, CheckCircle2 } from "lucide-react";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useWebsitePages } from "@/features/platform/hooks/useWebsitePages";

type ThemeRow = {
  tenantName: string;
  pageCount: number;
  publishedCount: number;
};

export default function WebsiteThemesPage() {
  const { data = [], isLoading, isError, error, refetch } = useWebsitePages();
  const [search, setSearch] = useState("");

  const themes = useMemo(() => {
    const grouped = new Map<string, ThemeRow>();
    for (const page of data) {
      const tenantName = page.tenantName || "Default tenant";
      const existing = grouped.get(tenantName) ?? {
        tenantName,
        pageCount: 0,
        publishedCount: 0,
      };
      existing.pageCount += 1;
      if (page.isPublished) existing.publishedCount += 1;
      grouped.set(tenantName, existing);
    }
    return [...grouped.values()].sort((a, b) => a.tenantName.localeCompare(b.tenantName));
  }, [data]);

  const filtered = themes.filter((row) => {
    const q = search.toLowerCase();
    return !q || row.tenantName.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Site Themes", value: themes.length, tone: "info", icon: <Palette className="h-3.5 w-3.5" />, subtext: "Tenants" },
    { label: "Managed Pages", value: data.length, tone: "warning", icon: <Globe className="h-3.5 w-3.5" />, subtext: "Live API" },
    { label: "Published", value: data.filter((p) => p.isPublished).length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Live" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Website Themes & Tenant Branding"
      subtitle="Tenant-scoped website content packs from the managed CMS service."
      categoryTag="Public Website Governance"
      kpiMetrics={kpis}
      searchPlaceholder="Filter tenant theme..."
      searchValue={search}
      onSearchChange={setSearch}
      onRefresh={() => void refetch()}
      isLoading={isLoading}
    >
      {isError && (
        <p className="px-4 py-3 text-xs text-rose-600 border-b border-[var(--border-subtle)]">
          {getApiErrorMessage(error, "Failed to load website themes.")}
        </p>
      )}
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Tenant / Theme Pack</th>
              <th className="erp-th">Pages</th>
              <th className="erp-th">Published</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={3} className="erp-td text-center py-8 text-xs text-muted-foreground">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={3} className="erp-td text-center py-8 text-xs text-muted-foreground">No themes found.</td></tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.tenantName} className="erp-tr">
                  <td className="erp-td"><div className="erp-row-title">{row.tenantName}</div></td>
                  <td className="erp-td">{row.pageCount}</td>
                  <td className="erp-td">{row.publishedCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
