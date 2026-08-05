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
  module: string;
  requiredPermission?: string;
  order: number;
  isActive: boolean;
}

const SEED_MENU_ITEMS: MenuItem[] = [
  { id: "m1", title: "Dashboard Hub", path: "/dashboard", module: "Core", order: 1, isActive: true },
  { id: "m2", title: "Tenant Directory", path: "/platform/tenants", module: "Platform", requiredPermission: "platform.tenants.manage", order: 2, isActive: true },
  { id: "m3", title: "User Directory", path: "/platform/users", module: "Platform", requiredPermission: "platform.users.manage", order: 3, isActive: true },
  { id: "m4", title: "General Ledger", path: "/finance/journals", module: "Finance", requiredPermission: "finance.journal.view", order: 4, isActive: true },
  { id: "m5", title: "Employee Register", path: "/hrms/employees", module: "HRMS", requiredPermission: "hrms.employee.view", order: 5, isActive: true },
  { id: "m6", title: "Sales Orders", path: "/sales/orders", module: "Sales", requiredPermission: "sales.order.view", order: 6, isActive: true },
  { id: "m7", title: "Stock Ledger", path: "/inventory/stock", module: "Inventory", requiredPermission: "inventory.stock.view", order: 7, isActive: true },
];

export default function MenuBuilderPage() {
  const [items, setItems] = useState<MenuItem[]>(SEED_MENU_ITEMS);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [path, setPath] = useState("");
  const [moduleName, setModuleName] = useState("Platform");
  const [permission, setPermission] = useState("");

  const handleCreateMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !path.trim()) return;

    const newItem: MenuItem = {
      id: `m_${Date.now()}`,
      title: title.trim(),
      path: path.trim(),
      module: moduleName,
      requiredPermission: permission.trim() || undefined,
      order: items.length + 1,
      isActive: true,
    };

    setItems((prev) => [...prev, newItem]);
    setIsDrawerOpen(false);
    setTitle("");
    setPath("");
    setPermission("");
    notifySuccess(`Navigation item "${newItem.title}" added to router registry.`);
  };

  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || item.title.toLowerCase().includes(q) || item.path.toLowerCase().includes(q);
    const matchesModule = moduleFilter === "all" || item.module.toLowerCase() === moduleFilter.toLowerCase();
    return matchesSearch && matchesModule;
  });

  const kpis: KpiMetricItem[] = [
    { label: "Navigation Items", value: items.length, tone: "info", icon: <Compass className="h-3.5 w-3.5" />, subtext: "Registered" },
    { label: "Modules Covered", value: new Set(items.map((i) => i.module)).size, tone: "positive", icon: <Layers className="h-3.5 w-3.5" />, subtext: "Modules" },
    { label: "RBAC Enforced Routes", value: items.filter((i) => i.requiredPermission).length, tone: "warning", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Protected" },
    { label: "Active Routes", value: items.filter((i) => i.isActive).length, tone: "positive", icon: <ArrowRight className="h-3.5 w-3.5" />, subtext: "Active" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Navigation Registry & Menu Builder"
      subtitle="Configure dynamic sidebar navigation routes, module order, and permission guards across submodules."
      categoryTag="UI Navigation Governance"
      kpiMetrics={kpis}
      searchPlaceholder="Search menu titles, route paths, or modules..."
      searchValue={search}
      onSearchChange={setSearch}
      filterOptions={[
        {
          key: "module",
          label: "All Modules",
          value: moduleFilter,
          onChange: setModuleFilter,
          options: [
            { label: "All Modules", value: "all" },
            { label: "Core", value: "core" },
            { label: "Platform", value: "platform" },
            { label: "Finance", value: "finance" },
            { label: "HRMS", value: "hrms" },
            { label: "Sales", value: "sales" },
          ],
        },
      ]}
      onClearFilters={() => {
        setSearch("");
        setModuleFilter("all");
      }}
      primaryActionLabel="New Route Item"
      onPrimaryAction={() => setIsDrawerOpen(true)}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
      isInspectorOpen={isDrawerOpen || !!selectedItem}
      onInspectorClose={() => {
        setIsDrawerOpen(false);
        setSelectedItem(null);
      }}
      inspectorTitle={selectedItem ? `Navigation Route: ${selectedItem.title}` : "Add Navigation Route Item"}
      inspectorSubTitle={selectedItem ? `Path ${selectedItem.path}` : "Register a route path in sidebar navigation matrix."}
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
                <span className="text-slate-500">Module:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedItem.module}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">RBAC Permission:</span>
                <span className="font-mono text-amber-600 dark:text-amber-400">{selectedItem.requiredPermission || "Public / Open"}</span>
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
              <Input placeholder="Invoice Manager" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">App Router Path *</Label>
              <Input placeholder="/finance/invoices" value={path} onChange={(e) => setPath(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Module Category</Label>
              <Input placeholder="Finance / HRMS / Platform" value={moduleName} onChange={(e) => setModuleName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Required RBAC Permission</Label>
              <Input placeholder="finance.invoice.view" value={permission} onChange={(e) => setPermission(e.target.value)} />
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
              <th className="erp-th">Module</th>
              <th className="erp-th">Required Permission</th>
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
                    {item.module}
                  </Badge>
                </td>
                <td className="erp-td font-mono text-xs text-slate-500">{item.requiredPermission || "None"}</td>
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
