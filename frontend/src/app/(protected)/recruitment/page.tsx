"use client";

import React, { useState } from "react";
import { Search, Plus, Eye, UserPlus, CheckCircle2, FileText, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface CandidateRow {
  id: string;
  name: string;
  position: string;
  experience: string;
  stage: "Applied" | "Screening" | "Interviewing" | "Offered" | "Hired";
  appliedDate: string;
}

const SEED_CANDIDATES: CandidateRow[] = [
  { id: "cand_1", name: "Siddharth Verma", position: "Senior .NET Core Developer", experience: "6 Yrs", stage: "Interviewing", appliedDate: "2026-07-28" },
  { id: "cand_2", name: "Neha Kulkarni", position: "Lead React Architect", experience: "8 Yrs", stage: "Offered", appliedDate: "2026-07-25" },
  { id: "cand_3", name: "Vikram Malhotra", position: "DevOps Engineer", experience: "4 Yrs", stage: "Screening", appliedDate: "2026-07-29" },
];

export default function RecruitmentAtsPage() {
  const [candidates] = useState<CandidateRow[]>(SEED_CANDIDATES);
  const [search, setSearch] = useState("");

  const filteredCandidates = candidates.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.position.toLowerCase().includes(q) || c.stage.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Active Requisitions", value: 8, tone: "info", icon: <FileText className="h-3.5 w-3.5" />, subtext: "Job Openings" },
    { label: "Total Candidates", value: candidates.length, tone: "positive", icon: <UserPlus className="h-3.5 w-3.5" />, subtext: "Talent Pool" },
    { label: "Interviews Scheduled", value: 5, tone: "warning", icon: <Calendar className="h-3.5 w-3.5" />, subtext: "This Week" },
    { label: "AI Resume Parser", value: "Active", tone: "positive", icon: <Sparkles className="h-3.5 w-3.5" />, subtext: "Automated" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Recruitment & Applicant Tracking System (ATS)"
      subtitle="Manage job requisitions, candidate talent pools, AI resume parsing, interview schedules, and offer letters."
      categoryTag="Layer 2: Talent Acquisition ATS"
      kpiMetrics={kpis}
      searchPlaceholder="Filter candidate name, position, or stage..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="Post Job Requisition"
      onPrimaryAction={() => notifySuccess("Job requisition wizard opened.")}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Candidate Name</th>
              <th className="erp-th">Applied Position</th>
              <th className="erp-th">Total Experience</th>
              <th className="erp-th">Applied Date</th>
              <th className="erp-th text-right">Pipeline Stage</th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.map((c) => (
              <tr key={c.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 text-indigo-500" />
                  {c.name}
                </td>
                <td className="erp-td font-mono text-xs text-indigo-600 dark:text-indigo-400">{c.position}</td>
                <td className="erp-td text-xs text-slate-700 dark:text-slate-300">{c.experience}</td>
                <td className="erp-td font-mono text-xs text-slate-500">{c.appliedDate}</td>
                <td className="erp-td text-right">
                  <span className={c.stage === "Offered" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-info"}>
                    {c.stage}
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
