"use client";

import React, { useState } from "react";
import { Layers, Plus, Eye, DollarSign, CheckCircle2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface BusinessUnitRow {
  id: string;
  code: string;
  name: string;
  headOfBu: string;
  revenueTarget: string;
  status: "Active" | "Inactive";
}

const SEED_BUS: BusinessUnitRow[] = [
  { id: "bu_1", code: "BU-SAAS", name: "Enterprise Cloud SaaS Product Division", headOfBu: "Dr. Vikram Seth", revenueTarget: "₹50 Cr", status: "Active" },
  { id: "bu_2", code: "BU-FINTECH", name: "Financial Services & Payment Gateway", headOfBu: "Ananya Roy", revenueTarget: "₹30 Cr", status: "Active" },
  { id: "bu_3", code: "BU-CONSULT", name: "Global ERP Consulting & Managed Services", headOfBu: "Rajesh Kumar", revenueTarget: "₹20 Cr", status: "Active" },
];

export default function BusinessUnitsPage() {
  const [bus] = useState<BusinessUnitRow[]>(SEED_BUS);
  const [search, setSearch] = useState("");

  const filteredBus = bus.filter((b) => {
    const q = search.toLowerCase();
    return !q || b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q) || b.headOfBu.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Active Business Units", value: bus.length, tone: "info", icon: <Layers className="h-3.5 w-3.5" />, subtext: "Divisions" },
    { label: "Total Revenue Target", value: "₹100 Cr", tone: "positive", icon: <DollarSign className="h-3.5 w-3.5" />, subtext: "FY 2026-27" },
    { label: "Operating Units", value: "100%", tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Active" },
    { label: "Division Leaders", value: bus.length, tone: "warning", icon: <Building2 className="h-3.5 w-3.5" />, subtext: "BU Heads" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Business Units & Corporate Revenue Divisions"
      subtitle="Register corporate business units, revenue division targets, and strategic unit leadership assignments."
      categoryTag="Organization Architecture"
      kpiMetrics={kpis}
      searchPlaceholder="Filter BU code, division name, or head..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="New Business Unit"
      onPrimaryAction={() => notifySuccess("Business unit creation wizard opened.")}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">BU Code</th>
              <th className="erp-th">Business Unit Division</th>
              <th className="erp-th">Head of BU</th>
              <th className="erp-th">Annual Revenue Target</th>
              <th className="erp-th text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredBus.map((b) => (
              <tr key={b.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">{b.code}</td>
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-indigo-500" />
                  {b.name}
                </td>
                <td className="erp-td text-xs text-slate-700 dark:text-slate-300">{b.headOfBu}</td>
                <td className="erp-td font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{b.revenueTarget}</td>
                <td className="erp-td text-right">
                  <span className="erp-chip erp-chip-success">{b.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
