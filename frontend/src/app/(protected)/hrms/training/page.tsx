"use client";

import React, { useState } from "react";
import { GraduationCap, Plus, Eye, Award, BookOpen, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface TrainingRow {
  id: string;
  courseTitle: string;
  category: string;
  instructor: string;
  enrolledCount: number;
  durationHours: number;
  status: "Active Program" | "Upcoming" | "Completed";
}

const SEED_TRAININGS: TrainingRow[] = [
  { id: "tr_101", courseTitle: "Enterprise Microservices & High-Concurrency Scaling", category: "Technical", instructor: "Dr. Vikram Seth", enrolledCount: 34, durationHours: 24, status: "Active Program" },
  { id: "tr_102", courseTitle: "POSH & Workplace Compliance 2026", category: "Compliance", instructor: "Priya Nair", enrolledCount: 120, durationHours: 4, status: "Active Program" },
  { id: "tr_103", courseTitle: "Financial Risk & Statutory Audit Training", category: "Finance", instructor: "Ananya Roy", enrolledCount: 18, durationHours: 12, status: "Completed" },
];

export default function TrainingLearningPage() {
  const [trainings] = useState<TrainingRow[]>(SEED_TRAININGS);
  const [search, setSearch] = useState("");

  const filteredTrainings = trainings.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.courseTitle.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.instructor.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Active Programs", value: trainings.filter((t) => t.status === "Active Program").length, tone: "positive", icon: <BookOpen className="h-3.5 w-3.5" />, subtext: "Learning Hub" },
    { label: "Total Enrolled Staff", value: trainings.reduce((acc, t) => acc + t.enrolledCount, 0), tone: "info", icon: <GraduationCap className="h-3.5 w-3.5" />, subtext: "Learners" },
    { label: "Certifications Awarded", value: 142, tone: "warning", icon: <Award className="h-3.5 w-3.5" />, subtext: "Certificates" },
    { label: "Completion Rate", value: "94.2%", tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Pass Rate" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Learning, Training Courses & Skill Certifications"
      subtitle="Manage corporate training programs, course catalogs, skill assessments, and employee certifications."
      categoryTag="Core HRMS: Learning & Development"
      kpiMetrics={kpis}
      searchPlaceholder="Filter course title, category, or instructor..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="Add Training Program"
      onPrimaryAction={() => notifySuccess("Training program modal opened.")}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Course Title</th>
              <th className="erp-th">Category</th>
              <th className="erp-th">Lead Instructor</th>
              <th className="erp-th">Enrolled Staff</th>
              <th className="erp-th">Duration</th>
              <th className="erp-th text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrainings.map((t) => (
              <tr key={t.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-indigo-500" />
                  {t.courseTitle}
                </td>
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {t.category}
                  </Badge>
                </td>
                <td className="erp-td text-xs text-slate-700 dark:text-slate-300">{t.instructor}</td>
                <td className="erp-td font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold">{t.enrolledCount} Staff</td>
                <td className="erp-td font-mono text-xs text-slate-500">{t.durationHours} Hours</td>
                <td className="erp-td text-right">
                  <span className={t.status === "Active Program" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
                    {t.status}
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
