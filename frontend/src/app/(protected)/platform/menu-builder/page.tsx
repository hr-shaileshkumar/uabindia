"use client";

import React, { useState } from "react";
import { SlidersHorizontal, Plus, Eye, Layers, Compass, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface MenuItem {
  id: string;
  title: string;
  path: string;
  category: string;
  requiredPermission?: string;
  order: number;
  isActive: boolean;
}

const MASTER_CATEGORIES = [
  "Dashboard", "Organization", "Identity & Access", "Platform Configuration",
  "Low-Code Platform", "Modules", "Workflow & Automation", "Website CMS",
  "Integrations", "Security", "Monitoring", "Audit & Compliance",
  "Backup & Recovery", "Licensing", "Data Management", "Developer Center",
  "AI Configuration", "Reports", "Support Center", "Recycle Bin",
  "System Tools", "Platform Settings"
];

const SEED_MENU_ITEMS: MenuItem[] = [
  { id: "m1", title: "Admin Overview", path: "/platform", category: "Dashboard", order: 1, isActive: true },
  { id: "m2", title: "Tenant Directory", path: "/platform/tenants", category: "Organization", requiredPermission: "platform.tenants.manage", order: 2, isActive: true },
  { id: "m3", title: "Company Directory", path: "/platform/companies", category: "Organization", requiredPermission: "platform.companies.manage", order: 3, isActive: true },
  { id: "m4", title: "User Directory", path: "/platform/users", category: "Identity & Access", requiredPermission: "platform.users.manage", order: 4, isActive: true },
  { id: "m5", title: "Roles & RBAC Matrix", path: "/platform/roles", category: "Identity & Access", requiredPermission: "platform.roles.manage", order: 5, isActive: true },
  { id: "m6", title: "Schema Manager", path: "/platform/schema-manager", category: "Low-Code Platform", requiredPermission: "platform.schema.manage", order: 6, isActive: true },
  { id: "m7", title: "Entity Builder", path: "/platform/entity-builder", category: "Low-Code Platform", requiredPermission: "platform.schema.manage", order: 7, isActive: true },
  { id: "m8", title: "Feature Flags", path: "/platform/feature-flags", category: "Modules", requiredPermission: "platform.flags.manage", order: 8, isActive: true },
  { id: "m9", title: "Workflow Config", path: "/platform/workflow-config", category: "Workflow & Automation", requiredPermission: "platform.workflows.manage", order: 9, isActive: true },
  { id: "m10", title: "Integrations & Connectors", path: "/platform/integrations/connectors", category: "Integrations", requiredPermission: "platform.integrations.manage", order: 10, isActive: true },
  { id: "m11", title: "Security & Sessions", path: "/platform/security/sessions", category: "Security", requiredPermission: "platform.security.manage", order: 11, isActive: true },
  { id: "m12", title: "Developer Center", path: "/platform/developer-center", category: "Developer Center", requiredPermission: "platform.developer.view", order: 12, isActive: true },
  { id: "m13", title: "AI Assistant Config", path: "/platform/ai-assistant", category: "AI Configuration", requiredPermission: "platform.ai.manage", order: 13, isActive: true },
  { id: "m14", title: "System Health Telemetry", path: "/platform/system-health", category: "Monitoring", requiredPermission: "platform.health.view", order: 14, isActive: true },
  { id: "m15", title: "Audit Logs", path: "/platform/audit-logs", category: "Audit & Compliance", requiredPermission: "platform.audit.view", order: 15, isActive: true },
  { id: "m16", title: "Recycle Bin", path: "/platform/recycle-bin", category: "Recycle Bin", requiredPermission: "platform.recycle.manage", order: 16, isActive: true },
];

export default function MenuBuilderPage() {
  const [items, setItems] = useState<MenuItem[]>(SEED_MENU_ITEMS);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [path, setPath] = useState("");
  const [category, setCategory] = useState("Organization");
  const [permission, setPermission] = useState("");

  const handleCreateMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !path.trim()) return;

    const newItem: MenuItem = {
      id: `m_${Date.now()}`,
      title: title.trim(),
      path: path.trim(),
      category,
      requiredPermission: permission.trim() || undefined,
      order: items.length + 1,
      isActive: true,
    };

    setItems((prev) => [...prev, newItem]);
    setIsDrawerOpen(false);
    setTitle("");
    setPath("");
    setPermission("");
    notifySuccess(`Navigation item "${newItem.title}" added to Master Navigation Registry.`);
  };

  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || item.title.toLowerCase().includes(q) || item.path.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === "all" || item.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const kpis: KpiMetricItem[] = [
    { label: "Navigation Routes", value: items.length, tone: "info", icon: <Compass className="h-3.5 w-3.5" />, subtext: "Master Tree" },
    { label: "Master Categories", value: new Set(items.map((i) => i.category)).size, tone: "positive", icon: <Layers className="h-3.5 w-3.5" />, subtext: "22 Standard" },
    { label: "RBAC Protected", value: items.filter((i) => i.requiredPermission).length, tone: "warning", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Enforced" },
    { label: "Active Routes", value: items.filter((i) => i.isActive).length, tone: "positive", icon: <ArrowRight className="h-3.5 w-3.5" />, subtext: "Live" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Master Navigation Registry & Menu Builder"
      subtitle="Organize top-level ERP sidebar navigation across 22 Enterprise SaaS Architecture categories."
      categoryTag="22-Category SaaS Navigation"
      kpiMetrics={kpis}
      searchPlaceholder="Search menu title, route path, or category..."
      searchValue={search}
      onSearchChange={setSearch}
      filterOptions={[
        {
          key: "category",
          label: "All 22 Categories",
          value: categoryFilter,
          onChange: setCategoryFilter,
          options: [
            { label: "All Categories", value: "all" },
            ...MASTER_CATEGORIES.map((cat) => ({ label: cat, value: cat.toLowerCase() })),
          ],
        },
      ]}
      onClearFilters={() => {
        setSearch("");
        setCategoryFilter("all");
      }}
      primaryActionLabel="New Route Entry"
      onPrimaryAction={() => setIsDrawerOpen(true)}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
      isInspectorOpen={isDrawerOpen || !!selectedItem}
      onInspectorClose={() => {
        setIsDrawerOpen(false);
        setSelectedItem(null);
      }}
      inspectorTitle={selectedItem ? `Navigation Route: ${selectedItem.title}` : "Register Master Route"}
      inspectorSubTitle={selectedItem ? `Path ${selectedItem.path}` : "Map route path to one of the 22 enterprise categories."}
      inspectorContent={
        selectedItem ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Route Title:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedItem.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">App Router Path:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{selectedItem.path}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Master Category:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedItem.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">RBAC Guard:</span>
                <span className="font-mono text-amber-600 dark:text-amber-400">{selectedItem.requiredPermission || "Public"}</span>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedItem(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateMenuItem} className="space-y-4 text-xs">
            <div className="space-y-2">
              <Label className="text-xs">Navigation Title *</Label>
              <Input placeholder="Branch Office Manager" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">App Router Path *</Label>
              <Input placeholder="/platform/branches" value={path} onChange={(e) => setPath(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Master Category</Label>
              <select className="erp-select text-xs" value={category} onChange={(e) => setCategory(e.target.value)}>
                {MASTER_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Required Permission</Label>
              <Input placeholder="platform.branches.manage" value={permission} onChange={(e) => setPermission(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2 pt-6">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Register Route
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
              <th className="erp-th">Seq</th>
              <th className="erp-th">Navigation Title</th>
              <th className="erp-th">Route Path</th>
              <th className="erp-th">Master Category</th>
              <th className="erp-th">RBAC Guard</th>
              <th className="erp-th">Status</th>
              <th className="erp-th text-right">Inspect</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-mono text-xs text-slate-400">#{item.order}</td>
                <td className="erp-td">
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Compass className="h-4 w-4 text-indigo-500" />
                    {item.title}
                  </span>
                </td>
                <td className="erp-td font-mono text-xs text-indigo-600 dark:text-indigo-400">{item.path}</td>
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {item.category}
                  </Badge>
                </td>
                <td className="erp-td font-mono text-xs text-slate-500">{item.requiredPermission || "Public"}</td>
                <td className="erp-td">
                  <span className={item.isActive ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
                    {item.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="erp-td text-right">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600" onClick={() => setSelectedItem(item)}>
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
