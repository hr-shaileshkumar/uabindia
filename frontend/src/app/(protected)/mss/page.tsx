"use client";

import React, { useState } from "react";
import { Users, Clock, CheckCircle2, AlertTriangle, FileCheck, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface PendingApprovalRow {
  id: string;
  employeeName: string;
  type: "Leave Request" | "Attendance Correction" | "Expense Claim" | "Tour Plan";
  details: string;
  requestedAt: string;
}

const SEED_APPROVALS: PendingApprovalRow[] = [
  { id: "app_1", employeeName: "Rahul Sharma", type: "Leave Request", details: "Casual Leave (2 Days: 10 Aug - 11 Aug)", requestedAt: "2026-08-05 14:20" },
  { id: "app_2", employeeName: "Priya Nair", type: "Expense Claim", details: "Mumbai Client Onsite Travel (₹4,800)", requestedAt: "2026-08-05 11:45" },
  { id: "app_3", employeeName: "Amit Verma", type: "Attendance Correction", details: "Punch In Missed (04 Aug 09:15 AM)", requestedAt: "2026-08-04 18:00" },
];

export default function ManagerSelfServicePage() {
  const [approvals, setApprovals] = useState<PendingApprovalRow[]>(SEED_APPROVALS);

  const handleApprove = (id: string, name: string) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
    notifySuccess(`Request for "${name}" approved successfully.`);
  };

  const kpis: KpiMetricItem[] = [
    { label: "Direct Reports", value: 14, tone: "info", icon: <Users className="h-3.5 w-3.5" />, subtext: "Software Team" },
    { label: "Team Present Today", value: "13 / 14", tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "92.8% Attendance" },
    { label: "Pending Approvals", value: approvals.length, tone: "warning", icon: <AlertTriangle className="h-3.5 w-3.5" />, subtext: "Action Required" },
    { label: "Quarterly OKR Status", value: "84%", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "On Track" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Manager Self-Service Portal (MSS)"
      subtitle="Management workspace for team attendance oversight, pending leave/expense approvals, OKR goal tracking, and hiring requisitions."
      categoryTag="Layer 3: Manager Self-Service"
      kpiMetrics={kpis}
    >
      <div className="p-6 space-y-6">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-indigo-500" />
          Pending Team Approvals Queue ({approvals.length})
        </h3>

        <div className="erp-table-wrap rounded-lg border">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Employee Name</th>
                <th className="erp-th">Request Type</th>
                <th className="erp-th">Details & Justification</th>
                <th className="erp-th">Timestamp</th>
                <th className="erp-th text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((a) => (
                <tr key={a.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-indigo-500" />
                    {a.employeeName}
                  </td>
                  <td className="erp-td">
                    <Badge variant="outline" className="text-xs font-normal">
                      {a.type}
                    </Badge>
                  </td>
                  <td className="erp-td text-xs text-slate-700 dark:text-slate-300">{a.details}</td>
                  <td className="erp-td font-mono text-xs text-slate-500">{a.requestedAt}</td>
                  <td className="erp-td text-right">
                    <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleApprove(a.id, a.employeeName)}>
                      Approve
                    </Button>
                  </td>
                </tr>
              ))}
              {approvals.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                    🎉 All pending team approvals have been processed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PlatformGlobalPageShell>
  );
}
