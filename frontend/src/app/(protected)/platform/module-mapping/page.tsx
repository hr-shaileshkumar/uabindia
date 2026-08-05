"use client";

import React, { useState } from "react";
import { SlidersHorizontal, Plus, Eye, Layers, ShieldCheck, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";

interface ModuleMappingRow {
  id: string;
  moduleKey: string;
  displayName: string;
  routePath: string;
  isEnabled: boolean;
  requiredRole: string;
}

const SEED_MODULES: ModuleMappingRow[] = [
  { id: "mm_1", moduleKey: "PLATFORM", displayName: "Platform Administration", routePath: "/platform", isEnabled: true, requiredRole: "SuperAdmin" },
  { id: "mm_2", moduleKey: "FINANCE", displayName: "Finance & General Ledger", routePath: "/finance", isEnabled: true, requiredRole: "FinanceManager" },
  { id: "mm_3", moduleKey: "HRMS", displayName: "Human Resource & Payroll", routePath: "/hrms", isEnabled: true, requiredRole: "HRManager" },
  { id: "mm_4", moduleKey: "SALES", displayName: "Sales & Order Processing", routePath: "/sales", isEnabled: true, requiredRole: "SalesLead" },
  { id: "mm_5", moduleKey: "INVENTORY", displayName: "Inventory & Warehousing", routePath: "/inventory", isEnabled: true, requiredRole: "WarehouseManager" },
];

export default function ModuleMappingPage() {
  const [modules, setModules] = useState<ModuleMappingRow[]>(SEED_MODULES);
  const [search, setSearch] = useState("");

  const filteredModules = modules.filter((m) => {
    const q = search.toLowerCase();
    return !q || m.displayName.toLowerCase().includes(q) || m.moduleKey.toLowerCase().includes(q) || m.routePath.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Mapped Modules", value: modules.length, tone: "info", icon: <Layers className="h-3.5 w-3.5" />, subtext: "System Modules" },
    { label: "Enabled Modules", value: modules.filter((m) => m.isEnabled).length, tone: "positive", icon: <CheckCircle2Icon className="h-3.5 w-3.5" />, subtext: "Active" },
    { label: "Router Entry Points", value: modules.length, tone: "warning", icon: <Compass className="h-3.5 w-3.5" />, subtext: "Routes" },
    { label: "RBAC Enforced", value: "100%", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Security" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Module Mapping & Subsystem Registry"
      subtitle="Register top-level ERP modules, base route entry points, and default role permissions."
      categoryTag="Subsystem Architecture"
      kpiMetrics={kpis}
      searchPlaceholder="Filter module key, name, or route..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Module Key</th>
              <th className="erp-th">Display Title</th>
              <th className="erp-th">Base Route Path</th>
              <th className="erp-th">Required Role</th>
              <th className="erp-th text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredModules.map((m) => (
              <tr key={m.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">{m.moduleKey}</td>
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100">{m.displayName}</td>
                <td className="erp-td font-mono text-xs text-slate-600 dark:text-slate-400">{m.routePath}</td>
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {m.requiredRole}
                  </Badge>
                </td>
                <td className="erp-td text-right">
                  <span className={m.isEnabled ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
                    {m.isEnabled ? "Active" : "Disabled"}
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

function CheckCircle2Icon(props: React.SVGProps<SVGSVGElement>) {
  return <ShieldCheck {...props} />;
}
