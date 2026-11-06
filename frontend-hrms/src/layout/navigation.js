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
          { label: 'ESS Hub Overview', path: '/module/hrms/ess', icon: User, permission: 'Dashboard' },
          { label: 'My Leaves & Balances', path: '/module/hrms/ess/leaves', icon: CalendarDays, permission: 'Dashboard' },
          { label: 'My Salary Slips', path: '/module/hrms/ess/payslips', icon: CreditCard, permission: 'Dashboard' },
          { label: 'HR Helpdesk Queries', path: '/module/hrms/ess/helpdesk', icon: FileText, permission: 'Dashboard' }
        ]
      }
    ]
  },
  {
    title: 'People & Operations',
    items: [
      { label: 'Employee Master', path: '/module/hrms/employee-master', icon: UserCheck, permission: 'EmployeeMaster' },
      { label: 'Attendance & Time', path: '/module/hrms/attendance', icon: Clock, permission: 'Attendance' },
      { label: 'Leave & Absence', path: '/module/hrms/leave', icon: CalendarDays, permission: 'Leave' },
      { label: 'Payroll & Slips', path: '/module/hrms/payroll', icon: CreditCard, permission: 'Payroll' },
      { label: 'Performance & KPI', path: '/module/hrms/performance', icon: Target, permission: 'Performance' },
      { label: 'Exit & Offboarding', path: '/module/hrms/exit-management', icon: LogOut, permission: 'ExitManagement' },
    ]
  },
  {
    title: 'Talent, Staffing & Mobility',
    items: [
      { label: 'Staffing Plans', path: '/module/hrms/staffing-plans', icon: Users, permission: 'EmployeeMaster' },
      { label: 'Job Requisitions & Board', path: '/module/hrms/job-postings', icon: Briefcase, permission: 'EmployeeMaster' },
      { label: 'Candidate ATS Pipeline', path: '/module/hrms/candidates', icon: UserPlus, permission: 'EmployeeMaster', badge: 'ATS' },
      { label: 'Automated Onboarding', path: '/module/hrms/onboarding', icon: UserCheck, permission: 'EmployeeMaster', badge: '1-Click' },
      { label: 'Employee Transfers', path: '/module/hrms/transfers', icon: ArrowRightLeft, permission: 'EmployeeMaster' },
      { label: 'Promotions & Hikes', path: '/module/hrms/promotions', icon: TrendingUp, permission: 'EmployeeMaster' },
    ]
  },
  {
    title: 'Learning & Development',
    items: [
      { label: 'Training Programs', path: '/module/hrms/training-programs', icon: GraduationCap, permission: 'EmployeeMaster' },
      { label: 'Training Nominations', path: '/module/hrms/training-nominations', icon: Award, permission: 'EmployeeMaster' },
    ]
  },
  {
    title: 'Organization & Structure',
    items: [
      { label: 'Enterprise Setup Hub', path: '/module/hrms/setup', icon: SlidersHorizontal, permission: 'SetupCenter' },
      { label: 'Companies Master', path: '/module/hrms/company-master', icon: Building2, permission: 'Companies' },
      {
        label: 'Location Hierarchy (7 Levels)',
        icon: MapPin,
        permission: 'OrganizationMaster',
        badge: '7 Levels',
        children: [
          { label: 'L1 • Country', path: '/module/hrms/country', icon: Globe, permission: 'OrganizationMaster' },
          { label: 'L2 • Zone', path: '/module/hrms/zone', icon: Layers, permission: 'OrganizationMaster' },
          { label: 'L3 • Region', path: '/module/hrms/region', icon: Compass, permission: 'OrganizationMaster' },
          { label: 'L4 • State', path: '/module/hrms/state', icon: Landmark, permission: 'OrganizationMaster' },
          { label: 'L5 • Cluster', path: '/module/hrms/cluster', icon: Network, permission: 'OrganizationMaster' },
          { label: 'L6 • District', path: '/module/hrms/district', icon: MapPin, permission: 'OrganizationMaster' },
          { label: 'L7 • Posting Location', path: '/module/hrms/location', icon: Navigation, permission: 'OrganizationMaster' }
        ]
      },
      {
        label: 'Organization Masters',
        icon: Briefcase,
        permission: 'OrganizationMaster',
        badge: '4 Masters',
        children: [
          { label: 'Departments', path: '/module/hrms/department', icon: Briefcase, permission: 'OrganizationMaster' },
          { label: 'Designations', path: '/module/hrms/designation', icon: Award, permission: 'OrganizationMaster' },
          { label: 'Branch Offices', path: '/module/hrms/branch', icon: GitBranch, permission: 'OrganizationMaster' },
          { label: 'Reporting Hierarchy', path: '/module/hrms/reporting-manager', icon: GitBranch, permission: 'OrganizationMaster' }
        ]
      },
      {
        label: 'Payroll & Work Masters',
        icon: SlidersHorizontal,
        permission: 'OrganizationMaster',
        badge: '6 Masters',
        children: [
          { label: 'Grades & Pay Bands', path: '/module/hrms/grade', icon: ShieldCheck, permission: 'OrganizationMaster' },
          { label: 'Work Shifts', path: '/module/hrms/shift', icon: Clock, permission: 'OrganizationMaster' },
          { label: 'Cost Centers', path: '/module/hrms/cost-center', icon: CreditCard, permission: 'OrganizationMaster' },
          { label: 'Employment Types', path: '/module/hrms/employment-type', icon: Users, permission: 'OrganizationMaster' },
          { label: 'Holiday Calendars', path: '/module/hrms/holiday-calendar', icon: CalendarDays, permission: 'OrganizationMaster' },
          { label: 'Leave Types', path: '/module/hrms/leave-type', icon: FileText, permission: 'OrganizationMaster' }
        ]
      },
      { label: 'Projects & Allocations', path: '/module/hrms/projects', icon: FolderKanban, permission: 'Projects' },
      { label: 'Statutory Compliance', path: '/module/hrms/compliance', icon: ShieldCheck, permission: 'Compliance' },
    ]
  },
  {
    title: 'Administration & Security',
    items: [
      { label: 'User Management', path: '/administration/users', icon: UserCog, permission: 'Users' },
      { label: 'Role Permissions', path: '/administration/role-access', icon: ShieldAlert, permission: 'RoleAccess' },
      { label: 'Form & Tab Studio', path: '/administration/form-studio', icon: LayoutGrid, permission: 'RoleAccess' },
      { label: 'Universal Data Import', path: '/bulk-import', icon: UploadCloud, permission: 'Import' },
      { label: 'Tenant Master', path: '/tenant-master', icon: Building2, superAdminOnly: true, permission: 'TenantMaster' },
      { label: 'Platform Settings', path: '/tenant-master/provider-setup', icon: SlidersHorizontal, superAdminOnly: true, permission: 'PlatformSettings' },
    ]
  }
]
