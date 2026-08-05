"use client";

import React, { useState } from "react";
import { UserMinus, Plus, Eye, CheckCircle2, FileText, DollarSign, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface OffboardingRow {
  id: string;
  employeeName: string;
  department: string;
  resignationDate: string;
  lastWorkingDay: string;
  clearanceCompleted: boolean;
  fnfSettlementAmount: string;
  status: "Resigned" | "Under Clearance" | "Settled & Relieved";
}

const SEED_OFFBOARDINGS: OffboardingRow[] = [
  { id: "off_1", employeeName: "Deepak Chawla", department: "Software Engineering", resignationDate: "2026-07-15", lastWorkingDay: "2026-08-15", clearanceCompleted: false, fnfSettlementAmount: "₹1,42,000", status: "Under Clearance" },
  { id: "off_2", employeeName: "Shweta Tiwari", department: "Corporate Finance", resignationDate: "2026-06-30", lastWorkingDay: "2026-07-31", clearanceCompleted: true, fnfSettlementAmount: "₹98,500", status: "Settled & Relieved" },
];

export default function OffboardingPage() {
  const [offboardings] = useState<OffboardingRow[]>(SEED_OFFBOARDINGS);
  const [search, setSearch] = useState("");

  const filteredOffboardings = offboardings.filter((o) => {
    const q = search.toLowerCase();
    return !q || o.employeeName.toLowerCase().includes(q) || o.department.toLowerCase().includes(q) || o.status.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Notice Period Active", value: offboardings.filter((o) => o.status !== "Settled & Relieved").length, tone: "warning", icon: <UserMinus className="h-3.5 w-3.5" />, subtext: "Notice Countdown" },
    { label: "Department Clearance", value: "80%", tone: "info", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "IT / Finance / HR" },
    { label: "Full & Final (F&F)", value: "₹2,40,500", tone: "positive", icon: <DollarSign className="h-3.5 w-3.5" />, subtext: "Calculated" },
    { label: "Relieving Letters", value: "Generated", tone: "positive", icon: <FileText className="h-3.5 w-3.5" />, subtext: "Digital Signed" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Employee Separation, Exit Clearance & F&F Settlement"
      subtitle="Manage resignation workflows, notice period tracking, cross-department clearance, Full & Final (F&F) payouts, and relieving letters."
      categoryTag="Core HRMS: Separation Lifecycle"
      kpiMetrics={kpis}
      searchPlaceholder="Filter employee name, department, or status..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="Initiate Resignation / Exit"
      onPrimaryAction={() => notifySuccess("Exit resignation wizard opened.")}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Employee Name</th>
              <th className="erp-th">Department</th>
              <th className="erp-th">Resignation Date</th>
              <th className="erp-th">Last Working Day</th>
              <th className="erp-th">F&F Settlement</th>
              <th className="erp-th text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredOffboardings.map((o) => (
              <tr key={o.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <UserMinus className="h-4 w-4 text-rose-500" />
                  {o.employeeName}
                </td>
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {o.department}
                  </Badge>
                </td>
                <td className="erp-td font-mono text-xs text-slate-500">{o.resignationDate}</td>
                <td className="erp-td font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">{o.lastWorkingDay}</td>
                <td className="erp-td font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">{o.fnfSettlementAmount}</td>
                <td className="erp-td text-right">
                  <span className={o.status === "Settled & Relieved" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
                    {o.status}
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
