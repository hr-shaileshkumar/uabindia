"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";

import React, { useMemo, useState } from "react";
import { FileText, Layers, CheckCircle2 } from "lucide-react";
import { AdministrationGlobalPageShell, KpiMetricItem } from "@/components/administration/AdministrationGlobalPageShell";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useWebsitePages } from "@/features/administration/hooks/useWebsitePages";

type TemplateRow = {
  pageType: string;
  pageCount: number;
  publishedCount: number;
};

function LegacyWebsiteTemplatesPage() {
  const { data = [], isLoading, isError, error, refetch } = useWebsitePages();
  const [search, setSearch] = useState("");

  const templates = useMemo(() => {
    const grouped = new Map<string, TemplateRow>();
    for (const page of data) {
      const existing = grouped.get(page.pageType) ?? {
        pageType: page.pageType,
        pageCount: 0,
        publishedCount: 0,
      };
      existing.pageCount += 1;
      if (page.isPublished) existing.publishedCount += 1;
      grouped.set(page.pageType, existing);
    }
    return [...grouped.values()].sort((a, b) => a.pageType.localeCompare(b.pageType));
  }, [data]);

  const filtered = templates.filter((row) => {
    const q = search.toLowerCase();
    return !q || row.pageType.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Templates", value: templates.length, tone: "info", icon: <Layers className="h-3.5 w-3.5" />, subtext: "Page types" },
    { label: "Managed Pages", value: data.length, tone: "warning", icon: <FileText className="h-3.5 w-3.5" />, subtext: "Live API" },
    { label: "Published", value: data.filter((p) => p.isPublished).length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Live" },
  ];

  return (
    <AdministrationGlobalPageShell
      title="Website Page Templates"
      subtitle="Distinct CMS page types derived from managed website content."
      categoryTag="Public Website Governance"
      kpiMetrics={kpis}
      searchPlaceholder="Filter template type..."
      searchValue={search}
      onSearchChange={setSearch}
      onRefresh={() => void refetch()}
      isLoading={isLoading}
    >
      {isError && (
        <p className="px-4 py-3 text-xs text-rose-600 border-b border-[var(--border-subtle)]">
          {getApiErrorMessage(error, "Failed to load website templates.")}
        </p>
      )}
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Template Type</th>
              <th className="erp-th">Pages</th>
              <th className="erp-th">Published</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={3} className="erp-td text-center py-8 text-xs text-muted-foreground">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={3} className="erp-td text-center py-8 text-xs text-muted-foreground">No templates found.</td></tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.pageType} className="erp-tr">
                  <td className="erp-td"><div className="erp-row-title">{row.pageType}</div></td>
                  <td className="erp-td">{row.pageCount}</td>
                  <td className="erp-td">{row.publishedCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdministrationGlobalPageShell>
  );
}

export default function WebsiteTemplatesPage() {
  return (
    <DynamicPage
      pageKey="administration.website.templates"
      fallback={<LegacyWebsiteTemplatesPage />}
      renderMode="auto"
    />
  );
}
