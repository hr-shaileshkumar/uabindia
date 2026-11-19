/**
 * Complete Hierarchical Navigation for Uabindia HRMS Client SaaS
 * 100% Aligned with Backend Database Modules & SubModules Schema (dbo.Modules & dbo.SubModules)
 * Contains strictly the HRMS module pages and submodules registered in the enterprise database.
 */

import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  Briefcase,
  TrendingUp,
  UserCheck,
  UserPlus,
  UserMinus,
  ShieldAlert,
  Award,
  BarChart2,
  GraduationCap,
  Plane,
  Building2,
  MapPin,
  GitBranch,
  CheckSquare,
  FileCheck,
  Laptop,
  ArrowRightLeft,
  UserCog,
  ShieldCheck,
  Sliders,
  Layers,
  FileText,
  CreditCard,
  Search,
} from "lucide-react";

export const ICON_MAP = {
  dashboard: LayoutDashboard,
  layoutdashboard: LayoutDashboard,
  users: Users,
  employees: Users,
  clock: Clock,
  clock9: Clock,
  attendance: Clock,
  calendar: Calendar,
  leave: Calendar,
  briefcase: Briefcase,
  recruitment: Briefcase,
  trendingup: TrendingUp,
  usercheck: UserCheck,
  userplus: UserPlus,
  userminus: UserMinus,
  shieldalert: ShieldAlert,
  shieldcheck: ShieldCheck,
  award: Award,
  barchart2: BarChart2,
  barchart: BarChart2,
  graduationcap: GraduationCap,
  plane: Plane,
  travel: Plane,
  building2: Building2,
  building: Building2,
  mappin: MapPin,
  gitbranch: GitBranch,
  checksquare: CheckSquare,
  filecheck: FileCheck,
  laptop: Laptop,
  arrowrightleft: ArrowRightLeft,
  usercog: UserCog,
  creditcard: CreditCard,
  filetext: FileText,
  sliders: Sliders,
  layers: Layers,
  search: Search,
  default: Users,
};

export const resolveNavIcon = (iconNameOrComponent) => {
  if (!iconNameOrComponent) return Users;
  if (typeof iconNameOrComponent !== "string") return iconNameOrComponent;
  const clean = iconNameOrComponent.toLowerCase().replace(/[^a-z0-9]/g, "");
  return ICON_MAP[clean] || ICON_MAP.default;
};

/**
 * HRMS SubModules & Pages canonical list directly derived from Database schema:
 * SubModules:
 *  1. hrms.core         - Core HR & Directory
 *  2. hrms.attendance   - Attendance & Shifts
 *  3. hrms.leaves       - Leave Operations
 *  4. hrms.recruitment  - Recruitment & ATS
 *  5. hrms.performance  - Performance & Growth
 *  6. hrms.talent       - Talent, Staffing & Mobility (Lifecycle)
 *  7. hrms.learning     - Learning & Development
 *  8. hrms.organization - Organization & Structure
 *  9. hrms.admin        - HR Administration (Travel)
 */
export const NAVIGATION_SECTIONS = [
  {
    id: "overview",
    subModuleKey: "overview",
    title: "Executive Overview",
    items: [
      {
        id: "dashboard",
        title: "HR Cockpit & KPIs",
        path: "/dashboard",
        icon: LayoutDashboard,
        badge: "Live",
        badgeVariant: "emerald",
      },
    ],
  },
  {
    id: "hrms.core",
    subModuleKey: "hrms.core",
    title: "Core HR & Directory",
    items: [
      {
        id: "employees",
        title: "Employee Directory",
        path: "/employees",
        icon: Users,
        pageKey: "hrms.employees",
      },
      {
        id: "employee-360",
        title: "Employee 360 Dossier",
        path: "/employees/360",
        icon: UserCheck,
        pageKey: "hrms.employee-360",
      },
      {
        id: "grades",
        title: "Grade Master",
        path: "/grades",
        icon: Award,
        pageKey: "hrms.grades",
      },
      {
        id: "employment-types",
        title: "Employment Types",
        path: "/employment-types",
        icon: Users,
        pageKey: "hrms.employment-types",
      },
      {
        id: "assets",
        title: "Employee Assets",
        path: "/assets",
        icon: Laptop,
        pageKey: "hrms.assets",
      },
    ],
  },
  {
    id: "hrms.attendance",
    subModuleKey: "hrms.attendance",
    title: "Attendance & Shifts",
    items: [
      {
        id: "attendance",
        title: "Attendance & Punches",
        path: "/attendance",
        icon: Clock,
        pageKey: "hrms.attendance",
      },
      {
        id: "muster-roll",
        title: "Monthly Muster Roll",
        path: "/attendance/muster-roll",
        icon: Calendar,
        pageKey: "hrms.muster-roll",
      },
      {
        id: "shifts",
        title: "Shifts & Rosters",
        path: "/shifts",
        icon: Clock,
        pageKey: "hrms.shifts",
      },
      {
        id: "overtime",
        title: "Overtime Requests",
        path: "/overtime",
        icon: Clock,
        pageKey: "hrms.overtime",
      },
      {
        id: "attendance-policy",
        title: "Attendance Policies",
        path: "/attendance/policy",
        icon: Sliders,
        pageKey: "hrms.attendance-policy",
      },
    ],
  },
  {
    id: "hrms.leaves",
    subModuleKey: "hrms.leaves",
    title: "Leave Operations",
    items: [
      {
        id: "leave",
        title: "Leave Management",
        path: "/leave",
        icon: Calendar,
        pageKey: "hrms.leave",
        badge: "4 Pending",
        badgeVariant: "amber",
      },
      {
        id: "leave-types",
        title: "Leave Types & Quotas",
        path: "/leave-types",
        icon: Calendar,
        pageKey: "hrms.leave-types",
      },
      {
        id: "leave-policy",
        title: "Leave Policies",
        path: "/leave/policy",
        icon: Sliders,
        pageKey: "hrms.leave-policy",
      },
    ],
  },
  {
    id: "hrms.recruitment",
    subModuleKey: "hrms.recruitment",
    title: "Recruitment & ATS",
    items: [
      {
        id: "recruitment",
        title: "Job Openings",
        path: "/recruitment",
        icon: Briefcase,
        pageKey: "hrms.recruitment",
      },
      {
        id: "candidates",
        title: "Candidate Pipeline (ATS)",
        path: "/candidates",
        icon: UserCheck,
        pageKey: "hrms.candidates",
        badge: "Kanban",
        badgeVariant: "emerald",
      },
      {
        id: "staffing-plans",
        title: "Staffing Plans",
        path: "/staffing-plans",
        icon: TrendingUp,
        pageKey: "hrms.staffing-plans",
      },
      {
        id: "screening-schedule",
        title: "Interview Schedule",
        path: "/screening-schedule",
        icon: Calendar,
        pageKey: "hrms.screening-schedule",
      },
      {
        id: "screening-results",
        title: "Assessment Results",
        path: "/screening-results",
        icon: FileCheck,
        pageKey: "hrms.screening-results",
      },
    ],
  },
  {
    id: "hrms.performance",
    subModuleKey: "hrms.performance",
    title: "Performance & Growth",
    items: [
      {
        id: "performance",
        title: "Performance (PMS)",
        path: "/performance",
        icon: BarChart2,
        pageKey: "hrms.performance",
      },
    ],
  },
  {
    id: "hrms.talent",
    subModuleKey: "hrms.talent",
    title: "Talent & Movement",
    items: [
      {
        id: "lifecycle",
        title: "Workforce Movement",
        path: "/lifecycle",
        icon: ArrowRightLeft,
        pageKey: "hrms.lifecycle",
        badge: "Transfers",
      },
      {
        id: "onboarding",
        title: "Onboarding Checklists",
        path: "/onboarding",
        icon: UserPlus,
        pageKey: "hrms.onboarding",
      },
      {
        id: "offboarding",
        title: "Offboarding & Exit",
        path: "/offboarding",
        icon: UserMinus,
        pageKey: "hrms.offboarding",
      },
      {
        id: "probation",
        title: "Probation & Confirmation",
        path: "/probation",
        icon: ShieldAlert,
        pageKey: "hrms.probation",
      },
      {
        id: "probation-policy",
        title: "Probation Policies",
        path: "/probation/policy",
        icon: Sliders,
        pageKey: "hrms.probation-policy",
      },
    ],
  },
  {
    id: "hrms.learning",
    subModuleKey: "hrms.learning",
    title: "Learning & Development",
    items: [
      {
        id: "training",
        title: "Training Programs",
        path: "/training",
        icon: GraduationCap,
        pageKey: "hrms.training",
      },
      {
        id: "assessments",
        title: "Course Assessments",
        path: "/assessments",
        icon: CheckSquare,
        pageKey: "hrms.assessments",
      },
      {
        id: "certificates",
        title: "Employee Certificates",
        path: "/certificates",
        icon: Award,
        pageKey: "hrms.certificates",
      },
    ],
  },
  {
    id: "hrms.organization",
    subModuleKey: "hrms.organization",
    title: "Organization & Structure",
    items: [
      {
        id: "organization",
        title: "Org Master (Dept & Desig)",
        path: "/organization",
        icon: Building2,
        pageKey: "hrms.organization",
      },
      {
        id: "locations",
        title: "Location Hierarchy (7 Tiers)",
        path: "/locations",
        icon: MapPin,
        badge: "7 Tiers",
        pageKey: "hrms.locations",
      },
      {
        id: "org-chart",
        title: "Interactive Org Chart",
        path: "/org-chart",
        icon: GitBranch,
        pageKey: "hrms.org-chart",
      },
    ],
  },
  {
    id: "hrms.admin",
    subModuleKey: "hrms.admin",
    title: "HR Administration",
    items: [
      {
        id: "travel",
        title: "Travel Requests",
        path: "/travel",
        icon: Plane,
        pageKey: "hrms.travel",
      },
      {
        id: "travel-policy",
        title: "Travel Policies",
        path: "/travel/policy",
        icon: Sliders,
        pageKey: "hrms.travel-policy",
      },
    ],
  },
  {
    id: "payroll",
    subModuleKey: "payroll",
    title: "Payroll & Compensation",
    items: [
      {
        id: "payroll-processing",
        title: "Payroll Processing",
        path: "/payroll",
        icon: CreditCard,
        pageKey: "payroll.runs",
        badge: "Monthly",
        badgeVariant: "emerald",
      },
      {
        id: "payslips",
        title: "Employee Payslips",
        path: "/payroll/payslips",
        icon: FileText,
        pageKey: "payroll.payslips",
      },
      {
        id: "payroll-structures",
        title: "Salary Structures",
        path: "/payroll/structures",
        icon: Sliders,
        pageKey: "payroll.structures",
      },
    ],
  },
  {
    id: "self-service",
    subModuleKey: "selfservice",
    title: "Employee & Manager Portals",
    items: [
      {
        id: "employee-portal",
        title: "Employee Self-Service (ESS)",
        path: "/self-service",
        icon: Users,
        pageKey: "ess.portal",
        badge: "ESS",
      },
      {
        id: "manager-portal",
        title: "Manager Self-Service (MSS)",
        path: "/manager-portal",
        icon: UserCheck,
        pageKey: "mss.portal",
        badge: "MSS",
      },
    ],
  },
];
