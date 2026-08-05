"use client";

import React, { useState } from "react";
import { LayoutTemplate, Plus, Eye, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";

interface TemplateRow {
  id: string;
  name: string;
  category: string;
  blocksCount: number;
  isSystemDefault: boolean;
}

const SEED_TEMPLATES: TemplateRow[] = [
  { id: "tmpl_1", name: "Landing Hero & Feature Matrix", category: "Marketing", blocksCount: 6, isSystemDefault: true },
  { id: "tmpl_2", name: "Multi-Tier Pricing Calculator", category: "Pricing", blocksCount: 4, isSystemDefault: true },
  { id: "tmpl_3", name: "Inbound Lead Contact Form", category: "Contact", blocksCount: 3, isSystemDefault: true },
  { id: "tmpl_4", name: "Enterprise Case Study Layout", category: "Blog", blocksCount: 5, isSystemDefault: false },
];

export default function WebsiteTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateRow[]>(SEED_TEMPLATES);
  const [search, setSearch] = useState("");

  const filteredTemplates = templates.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Page Templates", value: templates.length, tone: "info", icon: <LayoutTemplate className="h-3.5 w-3.5" />, subtext: "Library" },
    { label: "System Defaults", value: templates.filter((t) => t.isSystemDefault).length, tone: "positive", icon: <Layers className="h-3.5 w-3.5" />, subtext: "Preset" },
    { label: "Custom Layouts", value: templates.filter((t) => !t.isSystemDefault).length, tone: "warning", icon: <Plus className="h-3.5 w-3.5" />, subtext: "User Custom" },
    { label: "Reusable Blocks", value: "24 Blocks", tone: "positive", icon: <Layers className="h-3.5 w-3.5" />, subtext: "Block Engine" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Website Page Templates & Block Library"
      subtitle="Manage reusable page templates, hero blocks, pricing grids, and contact form layouts."
      categoryTag="Website CMS Engine"
      kpiMetrics={kpis}
      searchPlaceholder="Filter template name or category..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Template Name</th>
              <th className="erp-th">Category</th>
              <th className="erp-th">Block Components</th>
              <th className="erp-th text-right">Type</th>
            </tr>
          </thead>
          <tbody>
            {filteredTemplates.map((t) => (
              <tr key={t.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <LayoutTemplate className="h-4 w-4 text-indigo-500" />
                  {t.name}
                </td>
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {t.category}
                  </Badge>
                </td>
                <td className="erp-td font-mono text-xs text-slate-700 dark:text-slate-300">{t.blocksCount} Blocks</td>
                <td className="erp-td text-right">
                  <span className={t.isSystemDefault ? "erp-chip erp-chip-info" : "erp-chip erp-chip-success"}>
                    {t.isSystemDefault ? "System Preset" : "Custom"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
