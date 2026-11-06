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
  TrendingUp,
  UserCheck,
  MapPin,
  CreditCard,
} from "lucide-react";
import { UabModuleDashboard } from "@/components/dynamic/UabModuleDashboard";
import { ROUTES } from "@/constants/routes";

const LINKS = [
  { href: ROUTES.EMPLOYEES, label: "Employees", icon: Users, desc: "Directory, master, and employment records" },
  { href: ROUTES.ATTENDANCE, label: "Attendance & Muster Roll", icon: Clock, desc: "Daily punches, shifts, and overtime" },
  { href: "/payroll/runs", label: "Unified Payroll Run Wizard", icon: CreditCard, desc: "Monthly salary computation, statutory compliance, and disbursement lock" },
  { href: "/hrms/staffing-plans", label: "Staffing Plans", icon: TrendingUp, desc: "Headcount budgets and position requisitions" },
  { href: ROUTES.RECRUITMENT, label: "Recruitment & Jobs", icon: Briefcase, desc: "Openings, screening, and hiring pipeline" },
  { href: "/hrms/candidates", label: "Candidate ATS Pipeline", icon: UserCheck, desc: "Applicant screening and interview stages" },
  { href: "/hrms/locations", label: "Location Hierarchy (7 Levels)", icon: MapPin, desc: "Country, Zone, Region, State, Cluster, District, Geofenced Duty Stations" },
  { href: ROUTES.LEAVE, label: "Leave Management", icon: Calendar, desc: "Requests, balances, and policies" },
  { href: ROUTES.ONBOARDING, label: "Onboarding", icon: UserPlus, desc: "Joiner checklists and statutory setup" },
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
        { label: "Open Requisitions", value: data?.openRequisitions ?? 0, helper: "Recruiting", icon: Briefcase, tone: "neutral" },
      ]}
      kpis={[
        { label: "Active Employees", value: "—", helper: "On payroll roll", icon: Users, tone: "positive" },
        { label: "Present Today", value: "—", helper: "Biometric & Remote", icon: Clock, tone: "info" },
        { label: "On Leave Today", value: "—", helper: "Approved leaves", icon: Calendar, tone: "warning" },
        { label: "Hiring Openings", value: "—", helper: "Active requisitions", icon: Briefcase, tone: "neutral" },
      ]}
      links={LINKS}
    >
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <a
          href="/payroll/runs"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
        >
          <CreditCard className="w-3.5 h-3.5" />
          Unified Payroll Run Wizard
        </a>
        <a
          href="/hrms/attendance"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted/70 transition-colors text-foreground"
        >
          <Clock className="w-3.5 h-3.5" />
          Attendance Cockpit
        </a>
        <a
          href="/hrms/staffing-plans"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted/70 transition-colors text-foreground"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Staffing Plans
        </a>
      </div>
    </UabModuleDashboard>
  );
}
