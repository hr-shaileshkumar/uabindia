"use client";

import React, { useState } from "react";
import { UserPlus, Plus, Eye, CheckCircle2, FileText, Monitor, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface OnboardingRow {
  id: string;
  candidateName: string;
  designation: string;
  department: string;
  joiningDate: string;
  documentsVerified: boolean;
  assetAllocated: boolean;
  status: "In Progress" | "Completed" | "Pending Document";
}

const SEED_ONBOARDINGS: OnboardingRow[] = [
  { id: "onb_1", candidateName: "Kavita Krishnamurthy", designation: "Senior .NET Engineer", department: "Software Engineering", joiningDate: "2026-08-10", documentsVerified: true, assetAllocated: true, status: "In Progress" },
  { id: "onb_2", candidateName: "Manish Malhotra", designation: "Financial Analyst", department: "Corporate Finance", joiningDate: "2026-08-12", documentsVerified: false, assetAllocated: false, status: "Pending Document" },
  { id: "onb_3", candidateName: "Rohan Mehra", designation: "HR Operations Executive", department: "Human Resources", joiningDate: "2026-08-01", documentsVerified: true, assetAllocated: true, status: "Completed" },
];

export default function OnboardingPage() {
  const [onboardings] = useState<OnboardingRow[]>(SEED_ONBOARDINGS);
  const [search, setSearch] = useState("");

  const filteredOnboardings = onboardings.filter((o) => {
    const q = search.toLowerCase();
    return !q || o.candidateName.toLowerCase().includes(q) || o.designation.toLowerCase().includes(q) || o.department.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Active Onboardings", value: onboardings.filter((o) => o.status !== "Completed").length, tone: "info", icon: <UserPlus className="h-3.5 w-3.5" />, subtext: "Joining Pipeline" },
    { label: "Document Verification", value: "92%", tone: "positive", icon: <FileText className="h-3.5 w-3.5" />, subtext: "Aadhaar / PAN / Degree" },
    { label: "IT Asset Provisioned", value: "100%", tone: "positive", icon: <Monitor className="h-3.5 w-3.5" />, subtext: "Laptop & Credentials" },
    { label: "Induction Welcome", value: "Scheduled", tone: "warning", icon: <Mail className="h-3.5 w-3.5" />, subtext: "Orientation Kit" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Employee Onboarding & Joining Checklist"
      subtitle="Manage new hire joining checklists, background document verification, IT asset allocation, and welcome orientation."
      categoryTag="Core HRMS: Onboarding Lifecycle"
      kpiMetrics={kpis}
      searchPlaceholder="Filter candidate name, designation, or department..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="Initiate New Onboarding"
      onPrimaryAction={() => notifySuccess("Onboarding wizard opened.")}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">New Hire Candidate</th>
              <th className="erp-th">Designation & Department</th>
              <th className="erp-th">Joining Date</th>
              <th className="erp-th">Docs Verified</th>
              <th className="erp-th">Asset Provisioned</th>
              <th className="erp-th text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredOnboardings.map((o) => (
              <tr key={o.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 text-indigo-500" />
                  {o.candidateName}
                </td>
                <td className="erp-td">
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block">{o.designation}</span>
                  <span className="text-[11px] text-slate-500">{o.department}</span>
                </td>
                <td className="erp-td font-mono text-xs text-indigo-600 dark:text-indigo-400">{o.joiningDate}</td>
                <td className="erp-td">
                  <span className={o.documentsVerified ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
                    {o.documentsVerified ? "Verified" : "Pending Docs"}
                  </span>
                </td>
                <td className="erp-td">
                  <span className={o.assetAllocated ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
                    {o.assetAllocated ? "Allocated" : "Unassigned"}
                  </span>
                </td>
                <td className="erp-td text-right">
                  <span className={o.status === "Completed" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-info"}>
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
