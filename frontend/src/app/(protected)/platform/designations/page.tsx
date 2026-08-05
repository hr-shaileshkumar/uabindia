"use client";

import React, { useState } from "react";
import { Award, Plus, Eye, Layers, CheckCircle2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface DesignationRow {
  id: string;
  title: string;
  code: string;
  gradeBand: string;
  levelNumber: number;
  totalEmployees: number;
}

const SEED_DESIGNATIONS: DesignationRow[] = [
  { id: "des_1", title: "Principal Software Architect", code: "ENG-L6", gradeBand: "Band E6 (Executive)", levelNumber: 6, totalEmployees: 4 },
  { id: "des_2", title: "Senior Software Engineer", code: "ENG-L4", gradeBand: "Band E4 (Senior Staff)", levelNumber: 4, totalEmployees: 18 },
  { id: "des_3", title: "Financial Operations Lead", code: "FIN-L5", gradeBand: "Band E5 (Management)", levelNumber: 5, totalEmployees: 6 },
  { id: "des_4", title: "HR Business Partner", code: "HR-L4", gradeBand: "Band E4 (Senior Staff)", levelNumber: 4, totalEmployees: 8 },
];

export default function DesignationsPage() {
  const [designations] = useState<DesignationRow[]>(SEED_DESIGNATIONS);
  const [search, setSearch] = useState("");

  const filteredDesig = designations.filter((d) => {
    const q = search.toLowerCase();
    return !q || d.title.toLowerCase().includes(q) || d.code.toLowerCase().includes(q) || d.gradeBand.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Designations Configured", value: designations.length, tone: "info", icon: <Award className="h-3.5 w-3.5" />, subtext: "Job Hierarchy" },
    { label: "Grade Bands", value: new Set(designations.map((d) => d.gradeBand)).size, tone: "positive", icon: <Layers className="h-3.5 w-3.5" />, subtext: "Compensation" },
    { label: "Mapped Employees", value: designations.reduce((acc, d) => acc + d.totalEmployees, 0), tone: "warning", icon: <TrendingUp className="h-3.5 w-3.5" />, subtext: "Staff Mapped" },
    { label: "Structure Health", value: "Standardized", tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Clean Levels" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Designations, Job Levels & Grade Bands"
      subtitle="Define organizational job titles, career progression levels (L1 - L8), pay grade bands, and job descriptions."
      categoryTag="Organization Architecture"
      kpiMetrics={kpis}
      searchPlaceholder="Filter designation title, code, or grade band..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="New Designation"
      onPrimaryAction={() => notifySuccess("Designation modal opened.")}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Designation Code</th>
              <th className="erp-th">Job Designation Title</th>
              <th className="erp-th">Grade Band</th>
              <th className="erp-th">Level #</th>
              <th className="erp-th text-right">Mapped Employees</th>
            </tr>
          </thead>
          <tbody>
            {filteredDesig.map((d) => (
              <tr key={d.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">{d.code}</td>
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-indigo-500" />
                  {d.title}
                </td>
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {d.gradeBand}
                  </Badge>
                </td>
                <td className="erp-td font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">Level {d.levelNumber}</td>
                <td className="erp-td text-right font-mono text-xs text-slate-700 dark:text-slate-300">{d.totalEmployees} Staff</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
