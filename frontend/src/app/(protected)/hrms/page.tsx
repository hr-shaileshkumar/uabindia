"use client";

import {
  Users,
  Calendar,
  Clock,
  GraduationCap,
  Plane,
  UserPlus,
  UserMinus,
  Briefcase,
  Award,
  BarChart2,
} from "lucide-react";
import { UabModuleDashboard } from "@/components/dynamic/UabModuleDashboard";
import { ROUTES } from "@/constants/routes";

const LINKS = [
  { href: ROUTES.EMPLOYEES, label: "Employees", icon: Users, desc: "Directory, master, and employment records" },
  { href: ROUTES.ATTENDANCE, label: "Attendance", icon: Clock, desc: "Daily punches, shifts, and overtime" },
  { href: ROUTES.LEAVE, label: "Leave Management", icon: Calendar, desc: "Requests, balances, and policies" },
  { href: ROUTES.ONBOARDING, label: "Onboarding", icon: UserPlus, desc: "Joiner checklists and statutory setup" },
  { href: ROUTES.RECRUITMENT, label: "Recruitment", icon: Briefcase, desc: "Openings, screening, and hiring pipeline" },
  { href: ROUTES.PERFORMANCE, label: "Performance", icon: BarChart2, desc: "Appraisal cycles and 360° reviews" },
  { href: ROUTES.TRAINING, label: "Training", icon: GraduationCap, desc: "Courses, assessments, and certificates" },
  { href: ROUTES.TRAVEL, label: "Travel & Expenses", icon: Plane, desc: "Travel requests and reimbursements" },
  { href: ROUTES.OFFBOARDING, label: "Offboarding", icon: UserMinus, desc: "Exit clearance and full-and-final" },
  { href: ROUTES.HR_ASSETS, label: "Employee Assets", icon: Briefcase, desc: "Issue, recover, and track assets" },
  { href: "/hrms/grades", label: "Grade Master", icon: Award, desc: "Salary bands and grade progression" },
  { href: "/hrms/employment-types", label: "Employment Types", icon: Users, desc: "Employment classifications" },
];

export default function HrmsPage() {
  return (
    <UabModuleDashboard
      moduleKey="hrms"
      title="Human Resources"
      subtitle="People operations — headcount, attendance, leave, hiring, and the full employee lifecycle."
      eyebrow="HRMS"
      icon={Users}
      color="from-indigo-600 via-purple-600 to-pink-600"
      statsEndpoint="/hrms/dashboard/stats"
      statsMapper={(data) => [
        { label: "Active People", value: data?.activeEmployees ?? 0, helper: "On payroll roll", icon: Users, tone: "positive", trend: data?.employeeGrowthPct },
        { label: "Present Today", value: data?.presentToday ?? 0, helper: "Attendance", icon: Clock, tone: "info" },
        { label: "On Leave", value: data?.onLeaveToday ?? 0, helper: "Today", icon: Calendar, tone: "warning" },
        { label: "Open Positions", value: data?.openPositions ?? 0, helper: "Recruitment", icon: Briefcase, tone: "neutral" },
      ]}
      kpis={[
        { label: "Active People", value: "—", icon: Users, tone: "positive" },
        { label: "Present Today", value: "—", icon: Clock, tone: "info" },
        { label: "On Leave", value: "—", icon: Calendar, tone: "warning" },
        { label: "Open Positions", value: "—", icon: Briefcase, tone: "neutral" },
      ]}
      links={LINKS}
      linksTitle="HR Workspaces"
      activityEndpoint="/hrms/activity"
    />
  );
}
