import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layout/DashboardLayout'
import PermissionRoute from './components/PermissionRoute'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import ChangePassword from './pages/ChangePassword'
import Profile from './pages/Profile'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'


const Attendance = React.lazy(() => import('./module/HRMS/Attendance'))
const Leave = React.lazy(() => import('./module/HRMS/Leave'))
const Payroll = React.lazy(() => import('./module/HRMS/Payroll'))
const Performance = React.lazy(() => import('./module/HRMS/Performance'))
const Compliance = React.lazy(() => import('./module/HRMS/Compliance'))
const ExitManagement = React.lazy(() => import('./module/HRMS/ExitManagement'))
const ProjectsList = React.lazy(() => import('./module/HRMS/Projects/ProjectsList'))
const ProjectCreate = React.lazy(() => import('./module/HRMS/Projects/ProjectCreate'))
const ProjectEdit = React.lazy(() => import('./module/HRMS/Projects/ProjectEdit'))
const ProjectView = React.lazy(() => import('./module/HRMS/Projects/ProjectView'))

const EmployeeList = React.lazy(() => import('./module/HRMS/EmployeeMaster/EmployeeList'))
const EmployeeView = React.lazy(() => import('./module/HRMS/EmployeeMaster/EmployeeView'))
const EmployeeEdit = React.lazy(() => import('./module/HRMS/EmployeeMaster/EmployeeEdit'))
const EmployeeCreate = React.lazy(() => import('./module/HRMS/EmployeeMaster/EmployeeCreate'))
const CompanyList = React.lazy(() => import('./module/HRMS/CompanyMaster/CompanyList'))
const CompanyCreate = React.lazy(() => import('./module/HRMS/CompanyMaster/CompanyCreate'))
const CompanyView = React.lazy(() => import('./module/HRMS/CompanyMaster/CompanyView'))
const CompanyEdit = React.lazy(() => import('./module/HRMS/CompanyMaster/CompanyEdit'))
const OrganizationMaster = React.lazy(() => import('./module/HRMS/OrganizationMaster'))
const DedicatedMasterPage = React.lazy(() => import('./module/HRMS/MasterPages/DedicatedMasterPage'))
const SetupCenter = React.lazy(() => import('./module/HRMS/SetupCenter'))
const UserList = React.lazy(() => import('./module/Administration/Users/UserList'))
const BulkImportCenter = React.lazy(() => import('./module/Import/BulkImportCenter'))
const Recruitment = React.lazy(() => import('./module/HRMS/Recruitment'))
const ManpowerPlanning = React.lazy(() => import('./module/HRMS/Recruitment/ManpowerPlanning'))
const JobPostings = React.lazy(() => import('./module/HRMS/Recruitment/JobPostings'))
const CandidatePipeline = React.lazy(() => import('./module/HRMS/Recruitment/CandidatePipeline'))
const AutomatedOnboarding = React.lazy(() => import('./module/HRMS/Recruitment/AutomatedOnboarding'))
const EmployeeTransfer = React.lazy(() => import('./module/HRMS/WorkforceMovement/EmployeeTransfer'))
const EmployeePromotion = React.lazy(() => import('./module/HRMS/WorkforceMovement/EmployeePromotion'))
const Training = React.lazy(() => import('./module/HRMS/Training'))
const TrainingPrograms = React.lazy(() => import('./module/HRMS/Training/TrainingPrograms'))
const TrainingNominations = React.lazy(() => import('./module/HRMS/Training/TrainingNominations'))
const SelfService = React.lazy(() => import('./module/HRMS/SelfService'))
const EssLeaves = React.lazy(() => import('./module/HRMS/SelfService/EssLeaves'))
const EssPayslips = React.lazy(() => import('./module/HRMS/SelfService/EssPayslips'))
const EssHelpdesk = React.lazy(() => import('./module/HRMS/SelfService/EssHelpdesk'))

import ErrorBoundary from './components/ErrorBoundary'
import SuperAdminRedirect from './components/SuperAdminRedirect'

function Lazy({ children }) {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
            <p className="mt-3 text-xs font-medium text-slate-500">Loading module...</p>
          </div>
        }
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app-theme">
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/change-password" element={<ChangePassword />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* 1. Primary Executive Dashboard */}
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="home" element={<Navigate to="/dashboard" replace />} />
              <Route path="workspace" element={<Navigate to="/dashboard" replace />} />
              <Route path="module/hrms" element={<Navigate to="/dashboard" replace />} />

              {/* 2. Canonical ERP Unified Routes (Direct First-Class Components) */}
              {/* Employee Directory */}
              <Route path="hrms/employees" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><EmployeeList /></PermissionRoute></Lazy>} />
              <Route path="hrms/employees/create" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><EmployeeCreate /></PermissionRoute></Lazy>} />
              <Route path="hrms/employees/new" element={<Navigate to="/hrms/employees/create" replace />} />
              <Route path="hrms/employees/view/:id" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><EmployeeView /></PermissionRoute></Lazy>} />
              <Route path="hrms/employees/edit/:id" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><EmployeeEdit /></PermissionRoute></Lazy>} />
              <Route path="hrms/employees/:id" element={<Navigate to="/hrms/employees" replace />} />

              {/* Core Operations */}
              <Route path="hrms/attendance" element={<Lazy><PermissionRoute requiredPages={['Attendance']}><Attendance /></PermissionRoute></Lazy>} />
              <Route path="hrms/attendance/:view" element={<Lazy><PermissionRoute requiredPages={['Attendance']}><Attendance /></PermissionRoute></Lazy>} />
              <Route path="hrms/leave" element={<Lazy><PermissionRoute requiredPages={['Leave']}><Leave /></PermissionRoute></Lazy>} />
              <Route path="hrms/leave-type" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="leave-type" /></PermissionRoute></Lazy>} />
              <Route path="hrms/leave-types" element={<Navigate to="/hrms/leave-type" replace />} />
              <Route path="payroll" element={<Lazy><PermissionRoute requiredPages={['Payroll']}><Payroll /></PermissionRoute></Lazy>} />
              <Route path="payroll/runs" element={<Navigate to="/payroll" replace />} />
              <Route path="payroll/payslips" element={<Navigate to="/payroll" replace />} />
              <Route path="hrms/payroll" element={<Navigate to="/payroll" replace />} />
              <Route path="hrms/performance" element={<Lazy><PermissionRoute requiredPages={['Performance']}><Performance /></PermissionRoute></Lazy>} />
              <Route path="hrms/exit-management" element={<Lazy><PermissionRoute requiredPages={['ExitManagement']}><ExitManagement /></PermissionRoute></Lazy>} />
              <Route path="hrms/offboarding" element={<Navigate to="/hrms/exit-management" replace />} />
              <Route path="hrms/compliance" element={<Lazy><PermissionRoute requiredPages={['Compliance']}><Compliance /></PermissionRoute></Lazy>} />

              {/* Talent Acquisition & Mobility */}
              <Route path="hrms/recruitment" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><Recruitment /></PermissionRoute></Lazy>} />
              <Route path="hrms/staffing-plans" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><ManpowerPlanning /></PermissionRoute></Lazy>} />
              <Route path="hrms/manpower-planning" element={<Navigate to="/hrms/staffing-plans" replace />} />
              <Route path="hrms/job-postings" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><JobPostings /></PermissionRoute></Lazy>} />
              <Route path="hrms/candidates" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><CandidatePipeline /></PermissionRoute></Lazy>} />
              <Route path="hrms/onboarding" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><AutomatedOnboarding /></PermissionRoute></Lazy>} />
              <Route path="hrms/transfers" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><EmployeeTransfer /></PermissionRoute></Lazy>} />
              <Route path="hrms/promotions" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><EmployeePromotion /></PermissionRoute></Lazy>} />

              {/* Learning & Development */}
              <Route path="hrms/training" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><Training /></PermissionRoute></Lazy>} />
              <Route path="hrms/training-programs" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><TrainingPrograms /></PermissionRoute></Lazy>} />
              <Route path="hrms/training-nominations" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><TrainingNominations /></PermissionRoute></Lazy>} />

              {/* Employee Self-Service */}
              <Route path="ess" element={<Lazy><PermissionRoute requiredPages={['Dashboard']}><SelfService /></PermissionRoute></Lazy>} />
              <Route path="employee-self-service" element={<Navigate to="/ess" replace />} />
              <Route path="ess/leaves" element={<Lazy><PermissionRoute requiredPages={['Dashboard']}><EssLeaves /></PermissionRoute></Lazy>} />
              <Route path="ess/payslips" element={<Lazy><PermissionRoute requiredPages={['Dashboard']}><EssPayslips /></PermissionRoute></Lazy>} />
              <Route path="ess/helpdesk" element={<Lazy><PermissionRoute requiredPages={['Dashboard']}><EssHelpdesk /></PermissionRoute></Lazy>} />

              {/* Setup & Companies */}
              <Route path="hrms/setup" element={<Lazy><PermissionRoute requiredPages={['SetupCenter']}><SetupCenter /></PermissionRoute></Lazy>} />
              <Route path="hrms/setup/:companyId" element={<Lazy><PermissionRoute requiredPages={['SetupCenter']}><SetupCenter /></PermissionRoute></Lazy>} />
              <Route path="hrms/company-master" element={<Lazy><PermissionRoute requiredPages={['Companies']}><CompanyList /></PermissionRoute></Lazy>} />
              <Route path="hrms/company-master/create" element={<Lazy><PermissionRoute requiredPages={['Companies']}><CompanyCreate /></PermissionRoute></Lazy>} />
              <Route path="hrms/company-master/view/:id" element={<Lazy><PermissionRoute requiredPages={['Companies']}><CompanyView /></PermissionRoute></Lazy>} />
              <Route path="hrms/company-master/edit/:id" element={<Lazy><PermissionRoute requiredPages={['Companies']}><CompanyEdit /></PermissionRoute></Lazy>} />
              <Route path="companies" element={<Navigate to="/hrms/company-master" replace />} />
              <Route path="administration/companies" element={<Navigate to="/hrms/company-master" replace />} />

              {/* Dedicated Location Hierarchy Pages */}
              <Route path="hrms/country" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="country" /></PermissionRoute></Lazy>} />
              <Route path="hrms/zone" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="zone" /></PermissionRoute></Lazy>} />
              <Route path="hrms/region" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="region" /></PermissionRoute></Lazy>} />
              <Route path="hrms/state" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="state" /></PermissionRoute></Lazy>} />
              <Route path="hrms/cluster" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="cluster" /></PermissionRoute></Lazy>} />
              <Route path="hrms/district" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="district" /></PermissionRoute></Lazy>} />
              <Route path="hrms/location" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="location" /></PermissionRoute></Lazy>} />
              <Route path="hrms/posting-location" element={<Navigate to="/hrms/location" replace />} />

              {/* Dedicated Organization Masters */}
              <Route path="hrms/department" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="department" /></PermissionRoute></Lazy>} />
              <Route path="hrms/designation" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="designation" /></PermissionRoute></Lazy>} />
              <Route path="hrms/branch" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="branch" /></PermissionRoute></Lazy>} />
              <Route path="hrms/reporting-manager" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="reporting-manager" /></PermissionRoute></Lazy>} />
              <Route path="administration/departments" element={<Navigate to="/hrms/department" replace />} />
              <Route path="administration/designations" element={<Navigate to="/hrms/designation" replace />} />
              <Route path="administration/branches" element={<Navigate to="/hrms/branch" replace />} />

              {/* Dedicated Payroll & Work Structure */}
              <Route path="hrms/grade" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="grade" /></PermissionRoute></Lazy>} />
              <Route path="hrms/grades" element={<Navigate to="/hrms/grade" replace />} />
              <Route path="hrms/shift" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="shift" /></PermissionRoute></Lazy>} />
              <Route path="hrms/shifts" element={<Navigate to="/hrms/shift" replace />} />
              <Route path="hrms/cost-center" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="cost-center" /></PermissionRoute></Lazy>} />
              <Route path="hrms/cost-centers" element={<Navigate to="/hrms/cost-center" replace />} />
              <Route path="hrms/employment-type" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="employment-type" /></PermissionRoute></Lazy>} />
              <Route path="hrms/employment-types" element={<Navigate to="/hrms/employment-type" replace />} />
              <Route path="hrms/holiday-calendar" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="holiday-calendar" /></PermissionRoute></Lazy>} />
              <Route path="administration/holiday-calendar" element={<Navigate to="/hrms/holiday-calendar" replace />} />

              {/* Projects & Allocations */}
              <Route path="hrms/projects" element={<Lazy><PermissionRoute requiredPages={['Projects']}><ProjectsList /></PermissionRoute></Lazy>} />
              <Route path="hrms/projects/create" element={<Lazy><PermissionRoute requiredPages={['Projects']}><ProjectCreate /></PermissionRoute></Lazy>} />
              <Route path="hrms/projects/view/:id" element={<Lazy><PermissionRoute requiredPages={['Projects']}><ProjectView /></PermissionRoute></Lazy>} />
              <Route path="hrms/projects/edit/:id" element={<Lazy><PermissionRoute requiredPages={['Projects']}><ProjectEdit /></PermissionRoute></Lazy>} />
              <Route path="projects" element={<Navigate to="/hrms/projects" replace />} />
              <Route path="administration/projects" element={<Navigate to="/hrms/projects" replace />} />

              {/* Legacy Backward Compatibility Routes (/module/hrms/*) */}
              <Route path="module/hrms/employee-master" element={<Navigate to="/hrms/employees" replace />} />
              <Route path="module/hrms/employee-master/create" element={<Navigate to="/hrms/employees/create" replace />} />
              <Route path="module/hrms/employee-master/view/:id" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><EmployeeView /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/employee-master/edit/:id" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><EmployeeEdit /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/employee-master/documents/:id?" element={<Navigate to="/hrms/employees" replace />} />
              <Route path="module/hrms/employee-master/transfer/:id?" element={<Navigate to="/hrms/transfers" replace />} />
              <Route path="module/hrms/employee-master/promotion/:id?" element={<Navigate to="/hrms/promotions" replace />} />
              <Route path="module/hrms/employee-master/delete/:id" element={<Navigate to="/hrms/employees" replace />} />
              <Route path="module/hrms/employee-master/exit/:id?" element={<Navigate to="/hrms/exit-management" replace />} />
              <Route path="module/hrms/attendance" element={<Navigate to="/hrms/attendance" replace />} />
              <Route path="module/hrms/attendance/:view" element={<Navigate to="/hrms/attendance" replace />} />
              <Route path="module/hrms/leave" element={<Navigate to="/hrms/leave" replace />} />
              <Route path="module/hrms/payroll" element={<Navigate to="/payroll" replace />} />
              <Route path="module/hrms/performance" element={<Navigate to="/hrms/performance" replace />} />
              <Route path="module/hrms/compliance" element={<Navigate to="/hrms/compliance" replace />} />
              <Route path="module/hrms/exit-management" element={<Navigate to="/hrms/exit-management" replace />} />
              <Route path="module/hrms/recruitment" element={<Navigate to="/hrms/recruitment" replace />} />
              <Route path="module/hrms/staffing-plans" element={<Navigate to="/hrms/staffing-plans" replace />} />
              <Route path="module/hrms/manpower-planning" element={<Navigate to="/hrms/staffing-plans" replace />} />
              <Route path="module/hrms/job-postings" element={<Navigate to="/hrms/job-postings" replace />} />
              <Route path="module/hrms/candidates" element={<Navigate to="/hrms/candidates" replace />} />
              <Route path="module/hrms/onboarding" element={<Navigate to="/hrms/onboarding" replace />} />
              <Route path="module/hrms/transfers" element={<Navigate to="/hrms/transfers" replace />} />
              <Route path="module/hrms/promotions" element={<Navigate to="/hrms/promotions" replace />} />
              <Route path="module/hrms/training" element={<Navigate to="/hrms/training" replace />} />
              <Route path="module/hrms/training-programs" element={<Navigate to="/hrms/training-programs" replace />} />
              <Route path="module/hrms/training-nominations" element={<Navigate to="/hrms/training-nominations" replace />} />
              <Route path="module/hrms/ess" element={<Navigate to="/ess" replace />} />
              <Route path="module/hrms/ess/leaves" element={<Navigate to="/ess/leaves" replace />} />
              <Route path="module/hrms/ess/payslips" element={<Navigate to="/ess/payslips" replace />} />
              <Route path="module/hrms/ess/helpdesk" element={<Navigate to="/ess/helpdesk" replace />} />
              <Route path="module/hrms/company-master" element={<Navigate to="/hrms/company-master" replace />} />
              <Route path="module/hrms/company-master/create" element={<Navigate to="/hrms/company-master/create" replace />} />
              <Route path="module/hrms/company-master/view/:id" element={<Navigate to="/hrms/company-master" replace />} />
              <Route path="module/hrms/company-master/edit/:id" element={<Navigate to="/hrms/company-master" replace />} />
              <Route path="module/hrms/setup" element={<Navigate to="/hrms/setup" replace />} />
              <Route path="module/hrms/setup/:companyId" element={<Navigate to="/hrms/setup" replace />} />
              <Route path="module/hrms/company-setup" element={<Navigate to="/hrms/setup" replace />} />
              <Route path="module/hrms/company-setup/:companyId" element={<Navigate to="/hrms/setup" replace />} />
              <Route path="module/hrms/country" element={<Navigate to="/hrms/country" replace />} />
              <Route path="module/hrms/zone" element={<Navigate to="/hrms/zone" replace />} />
              <Route path="module/hrms/region" element={<Navigate to="/hrms/region" replace />} />
              <Route path="module/hrms/state" element={<Navigate to="/hrms/state" replace />} />
              <Route path="module/hrms/cluster" element={<Navigate to="/hrms/cluster" replace />} />
              <Route path="module/hrms/district" element={<Navigate to="/hrms/district" replace />} />
              <Route path="module/hrms/location" element={<Navigate to="/hrms/location" replace />} />
              <Route path="module/hrms/posting-location" element={<Navigate to="/hrms/location" replace />} />
              <Route path="module/hrms/department" element={<Navigate to="/hrms/department" replace />} />
              <Route path="module/hrms/designation" element={<Navigate to="/hrms/designation" replace />} />
              <Route path="module/hrms/branch" element={<Navigate to="/hrms/branch" replace />} />
              <Route path="module/hrms/reporting-manager" element={<Navigate to="/hrms/reporting-manager" replace />} />
              <Route path="module/hrms/grade" element={<Navigate to="/hrms/grade" replace />} />
              <Route path="module/hrms/shift" element={<Navigate to="/hrms/shift" replace />} />
              <Route path="module/hrms/cost-center" element={<Navigate to="/hrms/cost-center" replace />} />
              <Route path="module/hrms/employment-type" element={<Navigate to="/hrms/employment-type" replace />} />
              <Route path="module/hrms/holiday-calendar" element={<Navigate to="/hrms/holiday-calendar" replace />} />
              <Route path="module/hrms/leave-type" element={<Navigate to="/hrms/leave-type" replace />} />
              <Route path="module/hrms/projects" element={<Navigate to="/hrms/projects" replace />} />
              <Route path="module/hrms/projects/create" element={<Navigate to="/hrms/projects/create" replace />} />
              <Route path="module/hrms/projects/view/:id" element={<Navigate to="/hrms/projects" replace />} />
              <Route path="module/hrms/projects/edit/:id" element={<Navigate to="/hrms/projects" replace />} />
              <Route path="module/hrms/organization-master" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><OrganizationMaster /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/organization-master/:type" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/organization/:type" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/location-master/:type" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage /></PermissionRoute></Lazy>} />

              {/* 7. Field Operations (Removed - Redirect to Dashboard) */}
              <Route path="module/operations" element={<Navigate to="/dashboard" replace />} />
              <Route path="module/operations/*" element={<Navigate to="/dashboard" replace />} />

              {/* 8. HR Administration & Security */}
              <Route path="administration/users" element={<Lazy><PermissionRoute requiredPages={['Users']}><UserList /></PermissionRoute></Lazy>} />
              <Route path="users" element={<Navigate to="/administration/users" replace />} />
              <Route path="bulk-import" element={<Lazy><PermissionRoute requiredPages={['Import']}><BulkImportCenter /></PermissionRoute></Lazy>} />
              <Route path="module/import" element={<Navigate to="/bulk-import" replace />} />

              {/* Centralized SuperAdmin & Platform Governance - Redirect to Cloud ERP Control Plane */}
              <Route path="tenant-master" element={<SuperAdminRedirect title="Tenant Administration Centralized" />} />
              <Route path="tenant-master/*" element={<SuperAdminRedirect title="Tenant Administration Centralized" />} />
              <Route path="administration/role-access" element={<SuperAdminRedirect title="Role Access & IAM Centralized" />} />
              <Route path="role-access" element={<Navigate to="/administration/role-access" replace />} />
              <Route path="administration/form-studio" element={<SuperAdminRedirect title="Form Studio Centralized" />} />
              <Route path="form-studio" element={<Navigate to="/administration/form-studio" replace />} />
              <Route path="profile" element={<Profile />} />
              <Route path="change-password" element={<ChangePassword />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  )
}
