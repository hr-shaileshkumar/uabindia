"use client";

import React, { useState } from "react";
import { ShieldCheck, Plus, Download, FileText, CheckCircle2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface ComplianceRow {
  id: string;
  actName: string;
  code: string;
  frequency: "Monthly" | "Quarterly" | "Annual";
  dueDate: string;
  status: "Filed & Paid" | "Pending Return";
}

const SEED_COMPLIANCES: ComplianceRow[] = [
  { id: "comp_1", actName: "Provident Fund (EPF & EPS Challan ECR)", code: "PF-ACT-1952", frequency: "Monthly", dueDate: "15th of Every Month", status: "Filed & Paid" },
  { id: "comp_2", actName: "Employee State Insurance (ESIC Return)", code: "ESI-ACT-1948", frequency: "Monthly", dueDate: "15th of Every Month", status: "Filed & Paid" },
  { id: "comp_3", actName: "Professional Tax (PT State Filing)", code: "PT-MH-1975", frequency: "Monthly", dueDate: "30th of Every Month", status: "Filed & Paid" },
  { id: "comp_4", actName: "Tax Deducted at Source (TDS 24Q Quarterly Return)", code: "IT-ACT-1961", frequency: "Quarterly", dueDate: "31st July 2026", status: "Pending Return" },
  { id: "comp_5", actName: "Labour Welfare Fund (LWF Semi-Annual Return)", code: "LWF-MH-1953", frequency: "Annual", dueDate: "15th Jan / 15th July", status: "Filed & Paid" },
];

export default function StatutoryCompliancePage() {
  const [compliances] = useState<ComplianceRow[]>(SEED_COMPLIANCES);
  const [search, setSearch] = useState("");

  const filteredCompliances = compliances.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.actName.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Statutory Rules", value: compliances.length, tone: "info", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Active Acts" },
    { label: "Compliance Score", value: "100%", tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Zero Penalty" },
    { label: "EPF / ESI Challans", value: "Generated", tone: "positive", icon: <FileText className="h-3.5 w-3.5" />, subtext: "ECR Ready" },
    { label: "Form 16 / TDS 24Q", value: "Q1 Filed", tone: "warning", icon: <DollarSign className="h-3.5 w-3.5" />, subtext: "Quarterly" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Statutory Compliance Engine (PF, ESIC, PT, LWF, TDS)"
      subtitle="Manage Labour Welfare, Provident Fund (EPF), ESI, Professional Tax, TDS Form 16, and CLRA statutory return filings."
      categoryTag="Layer 2: Statutory Compliance & Governance"
      kpiMetrics={kpis}
      searchPlaceholder="Filter statutory act, code, or frequency..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="Generate ECR Challan"
      onPrimaryAction={() => notifySuccess("EPF / ESI ECR file generated.")}
      primaryActionIcon={<Download className="h-4 w-4 mr-1.5" />}
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Statutory Act & Return Title</th>
              <th className="erp-th">Act Code</th>
              <th className="erp-th">Filing Frequency</th>
              <th className="erp-th">Filing Due Date</th>
              <th className="erp-th text-right">Compliance Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompliances.map((c) => (
              <tr key={c.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  {c.actName}
                </td>
                <td className="erp-td font-mono text-xs text-indigo-600 dark:text-indigo-400">{c.code}</td>
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {c.frequency}
                  </Badge>
                </td>
                <td className="erp-td font-mono text-xs text-slate-500">{c.dueDate}</td>
                <td className="erp-td text-right">
                  <span className={c.status === "Filed & Paid" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
                    {c.status}
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
