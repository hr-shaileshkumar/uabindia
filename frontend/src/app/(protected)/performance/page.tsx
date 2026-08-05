"use client";

import React, { useState } from "react";
import { TrendingUp, Plus, Eye, Award, CheckCircle2, ShieldCheck, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface OkrRow {
  id: string;
  title: string;
  department: string;
  owner: string;
  progressPercent: number;
  status: "On Track" | "At Risk" | "Completed";
}

const SEED_OKRS: OkrRow[] = [
  { id: "okr_1", title: "Achieve 99.99% Multi-Tenant Microservices Uptime", department: "Software Engineering", owner: "Vikram Seth", progressPercent: 92, status: "On Track" },
  { id: "okr_2", title: "Automate Monthly Payroll & Statutory Compliance Returns", department: "Corporate Finance", owner: "Ananya Roy", progressPercent: 88, status: "On Track" },
  { id: "okr_3", title: "Reduce Candidate Hire Time from 45 to 20 Days", department: "HR & Recruitment", owner: "Priya Nair", progressPercent: 74, status: "At Risk" },
];

export default function PerformanceOkrPage() {
  const [okrs] = useState<OkrRow[]>(SEED_OKRS);
  const [search, setSearch] = useState("");

  const filteredOkrs = okrs.filter((o) => {
    const q = search.toLowerCase();
    return !q || o.title.toLowerCase().includes(q) || o.department.toLowerCase().includes(q) || o.owner.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Active OKRs", value: okrs.length, tone: "info", icon: <Target className="h-3.5 w-3.5" />, subtext: "Q3 Goals" },
    { label: "Avg Team Progress", value: "84.6%", tone: "positive", icon: <TrendingUp className="h-3.5 w-3.5" />, subtext: "On Track" },
    { label: "Appraisal Cycles", value: "Q3 Annual 2026", tone: "warning", icon: <Award className="h-3.5 w-3.5" />, subtext: "In Review" },
    { label: "360 Feedback", value: "Active", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Peer Reviews" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Performance Management, OKRs & 360 Appraisals"
      subtitle="Track quarterly OKRs, Key Result Areas (KRAs), 360-degree peer feedback, self-reviews, and promotion pipelines."
      categoryTag="Layer 2: Performance & Talent Development"
      kpiMetrics={kpis}
      searchPlaceholder="Filter OKR goal, department, or owner..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="Create OKR Goal"
      onPrimaryAction={() => notifySuccess("OKR goal creation modal opened.")}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Objective & Key Result (OKR)</th>
              <th className="erp-th">Department</th>
              <th className="erp-th">Goal Owner</th>
              <th className="erp-th">Progress</th>
              <th className="erp-th text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredOkrs.map((o) => (
              <tr key={o.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-indigo-500" />
                  {o.title}
                </td>
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {o.department}
                  </Badge>
                </td>
                <td className="erp-td text-xs text-slate-700 dark:text-slate-300">{o.owner}</td>
                <td className="erp-td font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">{o.progressPercent}%</td>
                <td className="erp-td text-right">
                  <span className={o.status === "On Track" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
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
