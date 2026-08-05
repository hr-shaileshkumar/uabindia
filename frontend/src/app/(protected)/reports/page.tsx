"use client";

import React, { useState } from "react";
import { BarChart3, Plus, Download, FileSpreadsheet, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface ReportDefRow {
  id: string;
  name: string;
  category: "HR Analytics" | "Payroll & Tax" | "Attendance" | "Compliance" | "Financial Audit";
  format: string;
  lastGeneratedAt: string;
}

const SEED_REPORTS: ReportDefRow[] = [
  { id: "rep_1", name: "Monthly Headcount & Attrition Analytics", category: "HR Analytics", format: "Excel / PDF", lastGeneratedAt: "2026-07-31" },
  { id: "rep_2", name: "Statutory PF ECR & ESIC Monthly Return", category: "Compliance", format: "TXT / ECR", lastGeneratedAt: "2026-07-29" },
  { id: "rep_3", name: "Payroll Master Reconciliation Summary", category: "Payroll & Tax", format: "Excel / CSV", lastGeneratedAt: "2026-07-31" },
  { id: "rep_4", name: "Attendance Regularization & Overtime Audit", category: "Attendance", format: "CSV", lastGeneratedAt: "2026-07-28" },
];

export default function ReportsCenterPage() {
  const [reports] = useState<ReportDefRow[]>(SEED_REPORTS);
  const [search, setSearch] = useState("");

  const filteredReports = reports.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Available Reports", value: reports.length, tone: "info", icon: <BarChart3 className="h-3.5 w-3.5" />, subtext: "Report Catalog" },
    { label: "Export Formats", value: "CSV, Excel, PDF", tone: "positive", icon: <FileSpreadsheet className="h-3.5 w-3.5" />, subtext: "Multi-Format" },
    { label: "Scheduled Reports", value: "Daily 06:00 AM", tone: "warning", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Automated Email" },
    { label: "Export Center", value: "Ready", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "High-Volume" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Enterprise Reports Center & Analytics Hub"
      subtitle="Generate, schedule, and export cross-module reports for HRMS, Payroll, Statutory Compliance, Attendance, and Financial Audits."
      categoryTag="Cross-Module Reporting Engine"
      kpiMetrics={kpis}
      searchPlaceholder="Filter report name or category..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="Build Custom Report"
      onPrimaryAction={() => notifySuccess("Custom report builder opened.")}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Report Title</th>
              <th className="erp-th">Category</th>
              <th className="erp-th">Supported Export Formats</th>
              <th className="erp-th">Last Generated</th>
              <th className="erp-th text-right">Generate</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((r) => (
              <tr key={r.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-indigo-500" />
                  {r.name}
                </td>
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {r.category}
                  </Badge>
                </td>
                <td className="erp-td font-mono text-xs text-indigo-600 dark:text-indigo-400">{r.format}</td>
                <td className="erp-td font-mono text-xs text-slate-500">{r.lastGeneratedAt}</td>
                <td className="erp-td text-right">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600" onClick={() => notifySuccess(`Report ${r.name} generated.`)}>
                    <Download className="h-4 w-4" />
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
