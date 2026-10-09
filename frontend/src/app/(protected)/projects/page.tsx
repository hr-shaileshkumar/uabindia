"use client";

import {
  FolderKanban,
  CheckSquare,
  Clock,
  Users,
  BarChart2,
  Milestone,
  FileText,
  CalendarDays,
} from "lucide-react";
import { UabModuleDashboard } from "@/components/dynamic/UabModuleDashboard";

const LINKS = [
  { href: "/projects/tasks", label: "Tasks", icon: CheckSquare, desc: "Assignments, priorities, and progress" },
  { href: "/projects/timesheets", label: "Timesheets", icon: Clock, desc: "Time entries and billing hours" },
  { href: "/projects/milestones", label: "Milestones", icon: Milestone, desc: "Project milestones and deliverables" },
  { href: "/projects/resources", label: "Resource Planning", icon: Users, desc: "Team capacity and allocation" },
  { href: "/projects/reports", label: "Project Reports", icon: BarChart2, desc: "Status, burn rate, and utilization" },
];

export default function ProjectsPage() {
  return (
    <UabModuleDashboard
      moduleKey="projects"
      title="Project Management"
      subtitle="Projects, tasks, milestones, resource planning, and time tracking."
      eyebrow="Projects"
      icon={FolderKanban}
      color="from-sky-600 via-blue-600 to-indigo-600"
      statsEndpoint="/projects/dashboard/stats"
      statsMapper={(data) => [
        { label: "Active Projects", value: data?.activeProjects ?? 0, icon: FolderKanban, tone: "positive" },
        { label: "Open Tasks", value: data?.openTasks ?? 0, icon: CheckSquare, tone: "info" },
        { label: "Overdue Tasks", value: data?.overdueTasks ?? 0, icon: CalendarDays, tone: "negative" },
        { label: "Hours Logged (MTD)", value: data?.hoursLoggedMTD ?? 0, icon: Clock, tone: "neutral" },
      ]}
      kpis={[
        { label: "Active Projects", value: "—", icon: FolderKanban, tone: "positive" },
        { label: "Open Tasks", value: "—", icon: CheckSquare, tone: "info" },
        { label: "Overdue Tasks", value: "—", icon: CalendarDays, tone: "negative" },
        { label: "Hours Logged (MTD)", value: "—", icon: Clock, tone: "neutral" },
      ]}
      links={LINKS}
      linksTitle="Project Workspaces"
    />
  );
}
