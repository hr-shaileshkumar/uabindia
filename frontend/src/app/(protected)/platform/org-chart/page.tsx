"use client";

import React from "react";
import { Users, ShieldCheck, ChevronRight, Award, Building2 } from "lucide-react";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { Badge } from "@/components/ui/badge";

interface OrgNode {
  name: string;
  title: string;
  department: string;
  directReportsCount: number;
  reportsTo?: string;
  subordinates?: OrgNode[];
}

const ORG_TREE: OrgNode = {
  name: "Dr. Vikram Seth",
  title: "Chief Executive Officer & Founder",
  department: "Executive Leadership",
  directReportsCount: 4,
  subordinates: [
    {
      name: "Ananya Roy",
      title: "Chief Financial Officer (CFO)",
      department: "Corporate Finance",
      directReportsCount: 18,
      reportsTo: "Dr. Vikram Seth",
    },
    {
      name: "Priya Nair",
      title: "Chief Human Resources Officer (CHRO)",
      department: "Human Resources",
      directReportsCount: 14,
      reportsTo: "Dr. Vikram Seth",
    },
    {
      name: "Rajesh Kumar",
      title: "VP of Engineering & Architecture",
      department: "Software Engineering",
      directReportsCount: 42,
      reportsTo: "Dr. Vikram Seth",
    },
  ],
};

export default function OrgChartPage() {
  const kpis: KpiMetricItem[] = [
    { label: "Total Organization Staff", value: 1420, tone: "info", icon: <Users className="h-3.5 w-3.5" />, subtext: "Employees" },
    { label: "Hierarchy Levels", value: "6 Levels", tone: "positive", icon: <Award className="h-3.5 w-3.5" />, subtext: "L1 - L6" },
    { label: "Direct Reporting Lines", value: "100%", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Fully Mapped" },
    { label: "Legal Entity Tree", value: "2 Companies", tone: "warning", icon: <Building2 className="h-3.5 w-3.5" />, subtext: "Multi-Company" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Visual Organization Chart & Reporting Hierarchy"
      subtitle="Interactive organizational hierarchy tree, direct reporting relationships, and escalation approval chains."
      categoryTag="Organization Architecture"
      kpiMetrics={kpis}
    >
      <div className="p-6 space-y-6">
        {/* CEO Node */}
        <div className="p-5 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-2 max-w-xl mx-auto shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-indigo-500" />
              {ORG_TREE.name}
            </span>
            <Badge className="bg-indigo-600 text-white font-mono text-[10px]">L6 - Executive</Badge>
          </div>
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{ORG_TREE.title}</p>
          <p className="text-xs text-slate-500">{ORG_TREE.department} • {ORG_TREE.directReportsCount} Direct Reports</p>
        </div>

        {/* Tree Connector Line */}
        <div className="w-0.5 h-8 bg-indigo-300 dark:bg-indigo-700 mx-auto" />

        {/* Subordinates Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {ORG_TREE.subordinates?.map((sub, idx) => (
            <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{sub.name}</span>
                <Badge variant="outline" className="text-[10px]">Reports to CEO</Badge>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{sub.title}</p>
              <p className="text-[11px] text-slate-500">{sub.department} • {sub.directReportsCount} Direct Reports</p>
            </div>
          ))}
        </div>
      </div>
    </PlatformGlobalPageShell>
  );
}
