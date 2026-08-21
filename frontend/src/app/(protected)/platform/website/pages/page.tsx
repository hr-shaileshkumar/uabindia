"use client";

import React, { useMemo, useState } from "react";
import { Globe, CheckCircle2, FileText } from "lucide-react";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { getApiErrorMessage } from "@/lib/api-errors";
import { mapWebsitePage, useWebsitePages } from "@/features/platform/hooks/useWebsitePages";

export default function WebsiteCMSPagesPage() {
  const { data = [], isLoading, isError, error, refetch } = useWebsitePages();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const pages = useMemo(() => data.map(mapWebsitePage), [data]);

  const filteredPages = pages.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || p.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const kpis: KpiMetricItem[] = [
    { label: "CMS Pages", value: pages.length, tone: "info", icon: <Globe className="h-3.5 w-3.5" />, subtext: "Live API" },
    { label: "Published", value: pages.filter((p) => p.status === "Published").length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Live" },
    { label: "Draft", value: pages.filter((p) => p.status === "Draft").length, tone: "warning", icon: <FileText className="h-3.5 w-3.5" />, subtext: "Draft" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Website pages"
      icon="globe"
      kpiMetrics={kpis}
      searchPlaceholder="Filter page title or slug..."
      searchValue={search}
      onSearchChange={setSearch}
      filterOptions={[
        {
          key: "status",
          label: "All Statuses",
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { label: "All Statuses", value: "all" },
            { label: "Published", value: "published" },
            { label: "Draft", value: "draft" },
          ],
        },
      ]}
      onClearFilters={() => {
        setSearch("");
        setStatusFilter("all");
      }}
      onRefresh={() => void refetch()}
      isLoading={isLoading}
      listKey="platform-website-pages"
      listRows={filteredPages}
      listColumns={[
        { key: "title", label: "Title" },
        { key: "slug", label: "Slug" },
        { key: "template", label: "Page type" },
        { key: "status", label: "Status" },
        { key: "tenantName", label: "Tenant" },
      ]}
      getRowId={(row) => row.id}
      emptyMessage="No website pages found."
      renderListRow={(p) => (
        <tr key={p.id} className="erp-tr">
          <td className="erp-td font-semibold">{p.title}</td>
          <td className="erp-td font-mono text-xs">{p.slug}</td>
          <td className="erp-td">{p.template}</td>
          <td className="erp-td">
            <span className={p.status === "Published" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>{p.status}</span>
          </td>
          <td className="erp-td text-slate-500">{p.tenantName ?? "—"}</td>
        </tr>
      )}
    >
      {isError ? <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load website pages.")}</div> : null}
    </PlatformGlobalPageShell>
  );
}
