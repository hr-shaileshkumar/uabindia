import {
  LayoutDashboard,
  LayoutGrid,
  Users,
  UserCheck,
  Clock,
  CalendarDays,
  CreditCard,
  Target,
  ShieldCheck,
  LogOut,
  FolderKanban,
  Building2,
  Activity,
  Compass,
  UploadCloud,
  Receipt,
  SlidersHorizontal,
  Briefcase,
  Award,
  GitBranch,
  MapPin,
  UserCog,
  ShieldAlert,
  Globe,
  Layers,
  Landmark,
  Network,
  Navigation,
  FileText,
  UserPlus,
  ArrowRightLeft,
  TrendingUp,
  GraduationCap,
  Sparkles,
  User
} from 'lucide-react'

export const navigationGroups = [
  {
    title: 'Overview & Self-Service',
    items: [
      { label: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'Dashboard' },
      {
        label: 'Employee Self-Service (ESS)',
        icon: User,
        permission: 'Dashboard',
        badge: 'Portal',
        children: [
          { label: 'ESS Hub Overview', path: '/ess', icon: User, permission: 'Dashboard' },
          { label: 'My Leaves & Balances', path: '/ess/leaves', icon: CalendarDays, permission: 'Dashboard' },
          { label: 'My Salary Slips', path: '/ess/payslips', icon: CreditCard, permission: 'Dashboard' },
          { label: 'HR Helpdesk Queries', path: '/ess/helpdesk', icon: FileText, permission: 'Dashboard' }
        ]
      }
    ]
  },
  {
    title: 'People & Operations',
    items: [
      { label: 'Employee Master', path: '/hrms/employees', icon: UserCheck, permission: 'EmployeeMaster' },
      { label: 'Attendance & Time', path: '/hrms/attendance', icon: Clock, permission: 'Attendance' },
      { label: 'Leave & Absence', path: '/hrms/leave', icon: CalendarDays, permission: 'Leave' },
      { label: 'Payroll & Slips', path: '/payroll', icon: CreditCard, permission: 'Payroll' },
      { label: 'Performance & KPI', path: '/hrms/performance', icon: Target, permission: 'Performance' },
      { label: 'Exit & Offboarding', path: '/hrms/exit-management', icon: LogOut, permission: 'ExitManagement' },
    ]
  },
  {
    title: 'Talent, Staffing & Mobility',
    items: [
      { label: 'Staffing Plans', path: '/hrms/staffing-plans', icon: Users, permission: 'EmployeeMaster' },
      { label: 'Job Requisitions & Board', path: '/hrms/job-postings', icon: Briefcase, permission: 'EmployeeMaster' },
      { label: 'Candidate ATS Pipeline', path: '/hrms/candidates', icon: UserPlus, permission: 'EmployeeMaster', badge: 'ATS' },
      { label: 'Automated Onboarding', path: '/hrms/onboarding', icon: UserCheck, permission: 'EmployeeMaster', badge: '1-Click' },
      { label: 'Employee Transfers', path: '/hrms/transfers', icon: ArrowRightLeft, permission: 'EmployeeMaster' },
      { label: 'Promotions & Hikes', path: '/hrms/promotions', icon: TrendingUp, permission: 'EmployeeMaster' },
    ]
  },
  {
    title: 'Learning & Development',
    items: [
      { label: 'Training Programs', path: '/hrms/training-programs', icon: GraduationCap, permission: 'EmployeeMaster' },
      { label: 'Training Nominations', path: '/hrms/training-nominations', icon: Award, permission: 'EmployeeMaster' },
    ]
  },
  {
    title: 'Organization & Structure',
    items: [
      { label: 'Enterprise Setup Hub', path: '/hrms/setup', icon: SlidersHorizontal, permission: 'SetupCenter' },
      { label: 'Companies Master', path: '/hrms/company-master', icon: Building2, permission: 'Companies' },
      {
        label: 'Location Hierarchy (7 Levels)',
        icon: MapPin,
        permission: 'OrganizationMaster',
        badge: '7 Levels',
        children: [
          { label: 'L1 • Country', path: '/hrms/country', icon: Globe, permission: 'OrganizationMaster' },
          { label: 'L2 • Zone', path: '/hrms/zone', icon: Layers, permission: 'OrganizationMaster' },
          { label: 'L3 • Region', path: '/hrms/region', icon: Compass, permission: 'OrganizationMaster' },
          { label: 'L4 • State', path: '/hrms/state', icon: Landmark, permission: 'OrganizationMaster' },
          { label: 'L5 • Cluster', path: '/hrms/cluster', icon: Network, permission: 'OrganizationMaster' },
          { label: 'L6 • District', path: '/hrms/district', icon: MapPin, permission: 'OrganizationMaster' },
          { label: 'L7 • Posting Location', path: '/hrms/location', icon: Navigation, permission: 'OrganizationMaster' }
        ]
      },
      {
        label: 'Organization Masters',
        icon: Briefcase,
        permission: 'OrganizationMaster',
        badge: '4 Masters',
        children: [
          { label: 'Departments', path: '/hrms/department', icon: Briefcase, permission: 'OrganizationMaster' },
          { label: 'Designations', path: '/hrms/designation', icon: Award, permission: 'OrganizationMaster' },
          { label: 'Branch Offices', path: '/hrms/branch', icon: GitBranch, permission: 'OrganizationMaster' },
          { label: 'Reporting Hierarchy', path: '/hrms/reporting-manager', icon: GitBranch, permission: 'OrganizationMaster' }
        ]
      },
      {
        label: 'Payroll & Work Masters',
        icon: SlidersHorizontal,
        permission: 'OrganizationMaster',
        badge: '6 Masters',
        children: [
          { label: 'Grades & Pay Bands', path: '/hrms/grade', icon: ShieldCheck, permission: 'OrganizationMaster' },
          { label: 'Work Shifts', path: '/hrms/shift', icon: Clock, permission: 'OrganizationMaster' },
          { label: 'Cost Centers', path: '/hrms/cost-center', icon: CreditCard, permission: 'OrganizationMaster' },
          { label: 'Employment Types', path: '/hrms/employment-type', icon: Users, permission: 'OrganizationMaster' },
          { label: 'Holiday Calendars', path: '/hrms/holiday-calendar', icon: CalendarDays, permission: 'OrganizationMaster' },
          { label: 'Leave Types', path: '/hrms/leave-type', icon: FileText, permission: 'OrganizationMaster' }
        ]
      },
      { label: 'Projects & Allocations', path: '/hrms/projects', icon: FolderKanban, permission: 'Projects' },
      { label: 'Statutory Compliance', path: '/hrms/compliance', icon: ShieldCheck, permission: 'Compliance' },
    ]
  },
  {
    title: 'HR Administration',
    items: [
      { label: 'User Directory', path: '/administration/users', icon: UserCog, permission: 'Users' },
      { label: 'Universal Data Import', path: '/bulk-import', icon: UploadCloud, permission: 'Import' },
    ]
  }
]
