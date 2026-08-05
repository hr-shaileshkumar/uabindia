"use client";

import React, { useState } from "react";
import { DollarSign, Plus, Eye, Layers, CheckCircle2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface CostCenterRow {
  id: string;
  code: string;
  name: string;
  type: "Cost Center" | "Profit Center";
  budgetAllocation: string;
  manager: string;
  status: "Active" | "Inactive";
}

const SEED_COST_CENTERS: CostCenterRow[] = [
  { id: "cc_101", code: "CC-ENG-1001", name: "Engineering R&D & Infrastructure", type: "Cost Center", budgetAllocation: "₹12.5 Cr", manager: "Dr. Vikram Seth", status: "Active" },
  { id: "cc_102", code: "PC-SAAS-2001", name: "Enterprise SaaS Subscription Sales", type: "Profit Center", budgetAllocation: "₹45.0 Cr", manager: "Ananya Roy", status: "Active" },
  { id: "cc_103", code: "CC-HR-3001", name: "People Operations & Recruitment", type: "Cost Center", budgetAllocation: "₹4.2 Cr", manager: "Priya Nair", status: "Active" },
];

export default function CostCentersPage() {
  const [costCenters] = useState<CostCenterRow[]>(SEED_COST_CENTERS);
  const [search, setSearch] = useState("");

  const filteredCc = costCenters.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.type.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Cost & Profit Centers", value: costCenters.length, tone: "info", icon: <DollarSign className="h-3.5 w-3.5" />, subtext: "Ledger Units" },
    { label: "Cost Centers", value: costCenters.filter((c) => c.type === "Cost Center").length, tone: "warning", icon: <Layers className="h-3.5 w-3.5" />, subtext: "Operational" },
    { label: "Profit Centers", value: costCenters.filter((c) => c.type === "Profit Center").length, tone: "positive", icon: <TrendingUp className="h-3.5 w-3.5" />, subtext: "Revenue Generating" },
    { label: "Budget Allocated", value: "₹61.7 Cr", tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Financial FY26" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Cost Centers & Profit Centers Master"
      subtitle="Configure General Ledger Cost Centers, Profit Centers, budget allocations, and responsible unit managers."
      categoryTag="Financial & Accounting Architecture"
      kpiMetrics={kpis}
      searchPlaceholder="Filter center code, name, or type..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="New Cost Center"
      onPrimaryAction={() => notifySuccess("Cost center modal opened.")}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Center Code</th>
              <th className="erp-th">Center Title</th>
              <th className="erp-th">Center Type</th>
              <th className="erp-th">Budget Allocation</th>
              <th className="erp-th">Unit Manager</th>
              <th className="erp-th text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredCc.map((c) => (
              <tr key={c.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">{c.code}</td>
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  {c.name}
                </td>
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {c.type}
                  </Badge>
                </td>
                <td className="erp-td font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{c.budgetAllocation}</td>
                <td className="erp-td text-xs text-slate-700 dark:text-slate-300">{c.manager}</td>
                <td className="erp-td text-right">
                  <span className="erp-chip erp-chip-success">{c.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
