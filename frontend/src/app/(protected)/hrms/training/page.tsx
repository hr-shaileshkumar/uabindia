"use client";

import { useCallback, useEffect, useState } from "react";
import { GraduationCap, Plus, Eye, Award, BookOpen, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";
import { hrApi } from "@/services/hrApi";
import { getApiErrorMessage } from "@/lib/api-errors";

interface TrainingRow {
  id: string;
  courseTitle: string;
  category: string;
  instructor: string;
  enrolledCount: number;
  durationHours: number;
  status: "Active Program" | "Upcoming" | "Completed";
}

type TrainingCourseResponse = {
  id: string;
  title?: string;
  name?: string;
  category?: string;
  instructor?: string;
  currentEnrollment?: number;
  durationHours?: number;
  duration?: number;
  status?: string;
};

function mapCourseStatus(status?: string): TrainingRow["status"] {
  switch ((status || "").toLowerCase()) {
    case "completed":
    case "archived":
      return "Completed";
    case "scheduled":
    case "draft":
      return "Upcoming";
    default:
      return "Active Program";
  }
}

export default function TrainingLearningPage() {
  const [trainings, setTrainings] = useState<TrainingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrApi.training.getCourses(0, 100);
      const courses = (Array.isArray(res.data) ? res.data : []) as TrainingCourseResponse[];
      setTrainings(
        courses.map((course) => ({
          id: course.id,
          courseTitle: course.title || course.name || "Untitled course",
          category: course.category || "General",
          instructor: course.instructor || "Unassigned",
          enrolledCount: course.currentEnrollment ?? 0,
          durationHours: course.durationHours ?? course.duration ?? 0,
          status: mapCourseStatus(course.status),
        }))
      );
    } catch (err) {
      setTrainings([]);
      setError(getApiErrorMessage(err, "Failed to load training courses."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCourses();
  }, [fetchCourses]);

  const filteredTrainings = trainings.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.courseTitle.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.instructor.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Active Programs", value: trainings.filter((t) => t.status === "Active Program").length, tone: "positive", icon: <BookOpen className="h-3.5 w-3.5" />, subtext: "Learning Hub" },
    { label: "Total Enrolled Staff", value: trainings.reduce((acc, t) => acc + t.enrolledCount, 0), tone: "info", icon: <GraduationCap className="h-3.5 w-3.5" />, subtext: "Learners" },
    { label: "Course Catalog", value: trainings.length, tone: "warning", icon: <Award className="h-3.5 w-3.5" />, subtext: "Courses" },
    { label: "Avg Duration", value: trainings.length ? `${Math.round(trainings.reduce((sum, t) => sum + t.durationHours, 0) / trainings.length)}h` : "0h", tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Per course" },
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
      onRefresh={() => void fetchCourses()}
      isLoading={loading}
      primaryActionLabel="Add Training Program"
      onPrimaryAction={() => notifySuccess("Training program modal opened.")}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
    >
      {error ? (
        <div className="px-6 py-4 text-sm text-red-600">{error}</div>
      ) : null}
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
                <td className="erp-td font-mono text-xs text-slate-700 dark:text-slate-300">{t.durationHours}h</td>
                <td className="erp-td text-right">
                  <span className={`erp-chip ${t.status === "Completed" ? "erp-chip-neutral" : t.status === "Upcoming" ? "erp-chip-warning" : "erp-chip-success"}`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && filteredTrainings.length === 0 ? (
              <tr>
                <td className="erp-td text-center text-sm text-muted-foreground" colSpan={6}>
                  No training courses found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
