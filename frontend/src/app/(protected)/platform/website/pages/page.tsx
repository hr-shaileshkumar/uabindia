"use client";

import React, { useState } from "react";
import { Globe, Plus, Eye, FileText, CheckCircle2, Search, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface WebsitePageRow {
  id: string;
  slug: string;
  title: string;
  template: string;
  status: "Published" | "Draft" | "Archived";
  seoScore: number;
  updatedAt: string;
}

const SEED_PAGES: WebsitePageRow[] = [
  { id: "wp_1", slug: "/", title: "Homepage - Enterprise SaaS ERP", template: "Landing Page", status: "Published", seoScore: 96, updatedAt: "2026-07-28" },
  { id: "wp_2", slug: "/pricing", title: "Subscription Plans & Pricing Calculator", template: "Pricing Grid", status: "Published", seoScore: 92, updatedAt: "2026-07-25" },
  { id: "wp_3", slug: "/contact", title: "Contact Sales & Request Demo", template: "Contact Form", status: "Published", seoScore: 90, updatedAt: "2026-07-20" },
  { id: "wp_4", slug: "/features/multi-tenancy", title: "Multi-Tenant Architecture Guide", template: "Feature Overview", status: "Draft", seoScore: 84, updatedAt: "2026-07-29" },
];

export default function WebsiteCMSPagesPage() {
  const [pages, setPages] = useState<WebsitePageRow[]>(SEED_PAGES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<WebsitePageRow | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [template, setTemplate] = useState("Landing Page");

  const handleCreatePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) return;

    const newP: WebsitePageRow = {
      id: `wp_${Date.now()}`,
      slug: slug.startsWith("/") ? slug : `/${slug}`,
      title: title.trim(),
      template,
      status: "Published",
      seoScore: 90,
      updatedAt: new Date().toISOString().split("T")[0],
    };

    setPages((prev) => [newP, ...prev]);
    setIsDrawerOpen(false);
    setTitle("");
    setSlug("");
    notifySuccess(`CMS Page "${newP.title}" published.`);
  };

  const filteredPages = pages.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || p.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const kpis: KpiMetricItem[] = [
    { label: "Published Pages", value: pages.filter((p) => p.status === "Published").length, tone: "positive", icon: <Globe className="h-3.5 w-3.5" />, subtext: "Live" },
    { label: "Draft Pages", value: pages.filter((p) => p.status === "Draft").length, tone: "warning", icon: <FileText className="h-3.5 w-3.5" />, subtext: "In Review" },
    { label: "Avg SEO Score", value: "92/100", tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Optimal" },
    { label: "Total Pages", value: pages.length, tone: "info", icon: <Sliders className="h-3.5 w-3.5" />, subtext: "Portal CMS" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Website Portal Pages & CMS Engine"
      subtitle="Create, edit, and publish public marketing website pages, SEO metadata, and slug routes."
      categoryTag="Website CMS Engine"
      kpiMetrics={kpis}
      searchPlaceholder="Filter page title, slug, or template..."
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
      primaryActionLabel="New CMS Page"
      onPrimaryAction={() => setIsDrawerOpen(true)}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
      isInspectorOpen={isDrawerOpen || !!selectedPage}
      onInspectorClose={() => {
        setIsDrawerOpen(false);
        setSelectedPage(null);
      }}
      inspectorTitle={selectedPage ? `Page: ${selectedPage.title}` : "Create Website CMS Page"}
      inspectorSubTitle={selectedPage ? `Slug ${selectedPage.slug}` : "Configure page title, route slug, and template."}
      inspectorContent={
        selectedPage ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Page Title:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedPage.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Route Slug:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{selectedPage.slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Template Layout:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedPage.template}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SEO Health Score:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedPage.seoScore}/100</span>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedPage(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreatePage} className="space-y-4 text-xs">
            <div className="space-y-2">
              <Label className="text-xs">Page Title *</Label>
              <Input placeholder="Enterprise Security Features" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Route Slug *</Label>
              <Input placeholder="/security" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Template Layout</Label>
              <select className="erp-select text-xs" value={template} onChange={(e) => setTemplate(e.target.value)}>
                <option value="Landing Page">Landing Page</option>
                <option value="Pricing Grid">Pricing Grid</option>
                <option value="Contact Form">Contact Form</option>
                <option value="Feature Overview">Feature Overview</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-6">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Publish Page
              </Button>
            </div>
          </form>
        )
      }
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Page Title</th>
              <th className="erp-th">Route Slug</th>
              <th className="erp-th">Template Layout</th>
              <th className="erp-th">SEO Score</th>
              <th className="erp-th">Status</th>
              <th className="erp-th text-right">Inspect</th>
            </tr>
          </thead>
          <tbody>
            {filteredPages.map((p) => (
              <tr key={p.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td">
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-indigo-500" />
                    {p.title}
                  </span>
                </td>
                <td className="erp-td font-mono text-xs text-indigo-600 dark:text-indigo-400">{p.slug}</td>
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {p.template}
                  </Badge>
                </td>
                <td className="erp-td font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{p.seoScore}/100</td>
                <td className="erp-td">
                  <span className={p.status === "Published" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
                    {p.status}
                  </span>
                </td>
                <td className="erp-td text-right">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600" onClick={() => setSelectedPage(p)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
