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
const TenantCreate = React.lazy(() => import('./module/TenantMaster/TenantCreate'))
const TenantView = React.lazy(() => import('./module/TenantMaster/TenantView'))
const TenantMaster = React.lazy(() => import('./module/TenantMaster'))
const TenantEdit = React.lazy(() => import('./module/TenantMaster/TenantEdit'))
const PlatformSettings = React.lazy(() => import('./module/TenantMaster/PlatformSettings'))
const CompanyList = React.lazy(() => import('./module/HRMS/CompanyMaster/CompanyList'))
const CompanyCreate = React.lazy(() => import('./module/HRMS/CompanyMaster/CompanyCreate'))
const CompanyView = React.lazy(() => import('./module/HRMS/CompanyMaster/CompanyView'))
const CompanyEdit = React.lazy(() => import('./module/HRMS/CompanyMaster/CompanyEdit'))
const OrganizationMaster = React.lazy(() => import('./module/HRMS/OrganizationMaster'))
const DedicatedMasterPage = React.lazy(() => import('./module/HRMS/MasterPages/DedicatedMasterPage'))
const SetupCenter = React.lazy(() => import('./module/HRMS/SetupCenter'))
const UserList = React.lazy(() => import('./module/Administration/Users/UserList'))
const RoleAccess = React.lazy(() => import('./module/Administration/Roles/RoleAccess'))
const BulkImportCenter = React.lazy(() => import('./module/Import/BulkImportCenter'))
const FormStudio = React.lazy(() => import('./module/Administration/FormStudio/FormStudio'))
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

              {/* Canonical ERP URL Compatibility Aliases */}
              <Route path="hrms/employees" element={<Navigate to="/module/hrms/employee-master" replace />} />
              <Route path="hrms/employees/new" element={<Navigate to="/module/hrms/employee-master/create" replace />} />
              <Route path="hrms/employees/:id" element={<Navigate to="/module/hrms/employee-master" replace />} />
              <Route path="hrms/attendance" element={<Navigate to="/module/hrms/attendance/combined" replace />} />
              <Route path="hrms/leave" element={<Navigate to="/module/hrms/leave" replace />} />
              <Route path="hrms/leave-types" element={<Navigate to="/module/hrms/leave-type" replace />} />
              <Route path="hrms/recruitment" element={<Navigate to="/module/hrms/recruitment" replace />} />
              <Route path="hrms/staffing-plans" element={<Navigate to="/module/hrms/staffing-plans" replace />} />
              <Route path="hrms/manpower-planning" element={<Navigate to="/module/hrms/staffing-plans" replace />} />
              <Route path="hrms/job-postings" element={<Navigate to="/module/hrms/job-postings" replace />} />
              <Route path="hrms/candidates" element={<Navigate to="/module/hrms/candidates" replace />} />
              <Route path="hrms/onboarding" element={<Navigate to="/module/hrms/onboarding" replace />} />
              <Route path="hrms/training" element={<Navigate to="/module/hrms/training" replace />} />
              <Route path="hrms/performance" element={<Navigate to="/module/hrms/performance" replace />} />
              <Route path="hrms/compliance" element={<Navigate to="/module/hrms/compliance" replace />} />
              <Route path="hrms/shifts" element={<Navigate to="/module/hrms/shift" replace />} />
              <Route path="hrms/grades" element={<Navigate to="/module/hrms/grade" replace />} />
              <Route path="payroll" element={<Navigate to="/module/hrms/payroll" replace />} />
              <Route path="payroll/runs" element={<Navigate to="/module/hrms/payroll" replace />} />
              <Route path="payroll/payslips" element={<Navigate to="/module/hrms/payroll" replace />} />
              <Route path="employee-self-service" element={<Navigate to="/module/hrms/ess" replace />} />
              <Route path="ess" element={<Navigate to="/module/hrms/ess" replace />} />
              <Route path="companies" element={<Navigate to="/module/hrms/company-master" replace />} />
              <Route path="projects" element={<Navigate to="/module/hrms/projects" replace />} />

              {/* 2. Employee Directory & Profile */}
              <Route path="module/hrms/employee-master" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><EmployeeList /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/employee-master/create" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><EmployeeCreate /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/employee-master/view/:id" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><EmployeeView /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/employee-master/edit/:id" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><EmployeeEdit /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/employee-master/documents/:id?" element={<Navigate to="/module/hrms/employee-master" replace />} />
              <Route path="module/hrms/employee-master/transfer/:id?" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><EmployeeTransfer /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/employee-master/promotion/:id?" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><EmployeePromotion /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/employee-master/delete/:id" element={<Navigate to="/module/hrms/employee-master" replace />} />
              <Route path="module/hrms/employee-master/exit/:id?" element={<Navigate to="/module/hrms/exit-management" replace />} />

              {/* 3. Talent Acquisition, Staffing & Mobility (Dedicated Separate Pages & Tables) */}
              <Route path="module/hrms/recruitment" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><Recruitment /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/staffing-plans" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><ManpowerPlanning /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/manpower-planning" element={<Navigate to="/module/hrms/staffing-plans" replace />} />
              <Route path="module/hrms/job-postings" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><JobPostings /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/candidates" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><CandidatePipeline /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/onboarding" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><AutomatedOnboarding /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/transfers" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><EmployeeTransfer /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/promotions" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><EmployeePromotion /></PermissionRoute></Lazy>} />

              {/* Learning & Development (Dedicated Separate Pages & Tables) */}
              <Route path="module/hrms/training" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><Training /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/training-programs" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><TrainingPrograms /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/training-nominations" element={<Lazy><PermissionRoute requiredPages={['EmployeeMaster']}><TrainingNominations /></PermissionRoute></Lazy>} />

              {/* Employee Self-Service (Dedicated Separate Pages & Tables) */}
              <Route path="module/hrms/ess" element={<Lazy><PermissionRoute requiredPages={['Dashboard']}><SelfService /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/ess/leaves" element={<Lazy><PermissionRoute requiredPages={['Dashboard']}><EssLeaves /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/ess/payslips" element={<Lazy><PermissionRoute requiredPages={['Dashboard']}><EssPayslips /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/ess/helpdesk" element={<Lazy><PermissionRoute requiredPages={['Dashboard']}><EssHelpdesk /></PermissionRoute></Lazy>} />

              {/* 4. Core HR Operations */}
              <Route path="module/hrms/attendance" element={<Navigate to="/module/hrms/attendance/combined" replace />} />
              <Route path="module/hrms/attendance/:view" element={<Lazy><PermissionRoute requiredPages={['Attendance']}><Attendance /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/leave" element={<Lazy><PermissionRoute requiredPages={['Leave']}><Leave /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/payroll" element={<Lazy><PermissionRoute requiredPages={['Payroll']}><Payroll /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/performance" element={<Lazy><PermissionRoute requiredPages={['Performance']}><Performance /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/compliance" element={<Lazy><PermissionRoute requiredPages={['Compliance']}><Compliance /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/exit-management" element={<Lazy><PermissionRoute requiredPages={['ExitManagement']}><ExitManagement /></PermissionRoute></Lazy>} />

              {/* 4. Companies & Enterprise Setup Hub */}
              <Route path="module/hrms/company-master" element={<Lazy><PermissionRoute requiredPages={['Companies']}><CompanyList /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/company-master/create" element={<Lazy><PermissionRoute requiredPages={['Companies']}><CompanyCreate /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/company-master/view/:id" element={<Lazy><PermissionRoute requiredPages={['Companies']}><CompanyView /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/company-master/edit/:id" element={<Lazy><PermissionRoute requiredPages={['Companies']}><CompanyEdit /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/setup" element={<Lazy><PermissionRoute requiredPages={['SetupCenter']}><SetupCenter /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/setup/:companyId" element={<Lazy><PermissionRoute requiredPages={['SetupCenter']}><SetupCenter /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/company-setup" element={<Navigate to="/module/hrms/setup" replace />} />
              <Route path="module/hrms/company-setup/:companyId" element={<Navigate to="/module/hrms/setup" replace />} />

              {/* 5. Organization, Location Hierarchy & Work Structure Masters */}
              <Route path="module/hrms/organization-master" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><OrganizationMaster /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/organization-master/:type" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/organization/:type" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/location-master/:type" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage /></PermissionRoute></Lazy>} />

              {/* Dedicated Location Hierarchy Pages */}
              <Route path="module/hrms/country" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="country" /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/zone" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="zone" /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/region" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="region" /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/state" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="state" /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/cluster" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="cluster" /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/district" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="district" /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/location" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="location" /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/posting-location" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="location" /></PermissionRoute></Lazy>} />

              {/* Dedicated Organization Masters Pages */}
              <Route path="module/hrms/department" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="department" /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/designation" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="designation" /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/branch" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="branch" /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/reporting-manager" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="reporting-manager" /></PermissionRoute></Lazy>} />

              {/* Dedicated Payroll & Work Structure Pages */}
              <Route path="module/hrms/grade" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="grade" /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/shift" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="shift" /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/cost-center" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="cost-center" /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/employment-type" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="employment-type" /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/holiday-calendar" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="holiday-calendar" /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/leave-type" element={<Lazy><PermissionRoute requiredPages={['OrganizationMaster']}><DedicatedMasterPage masterKey="leave-type" /></PermissionRoute></Lazy>} />

              {/* 6. Projects & Allocations */}
              <Route path="module/hrms/projects" element={<Lazy><PermissionRoute requiredPages={['Projects']}><ProjectsList /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/projects/create" element={<Lazy><PermissionRoute requiredPages={['Projects']}><ProjectCreate /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/projects/view/:id" element={<Lazy><PermissionRoute requiredPages={['Projects']}><ProjectView /></PermissionRoute></Lazy>} />
              <Route path="module/hrms/projects/edit/:id" element={<Lazy><PermissionRoute requiredPages={['Projects']}><ProjectEdit /></PermissionRoute></Lazy>} />

              {/* 7. Field Operations (Removed - Redirect to Dashboard) */}
              <Route path="module/operations" element={<Navigate to="/dashboard" replace />} />
              <Route path="module/operations/*" element={<Navigate to="/dashboard" replace />} />

              {/* 8. Administration, Security & Multi-Tenancy */}
              <Route path="administration/users" element={<Lazy><PermissionRoute requiredPages={['Users']}><UserList /></PermissionRoute></Lazy>} />
              <Route path="users" element={<Navigate to="/administration/users" replace />} />
              <Route path="administration/role-access" element={<Lazy><PermissionRoute requiredPages={['RoleAccess']}><RoleAccess /></PermissionRoute></Lazy>} />
              <Route path="role-access" element={<Navigate to="/administration/role-access" replace />} />
              <Route path="tenant-master" element={<Lazy><PermissionRoute requiredRole="SuperAdmin"><TenantMaster /></PermissionRoute></Lazy>} />
              <Route path="tenant-master/provider-setup" element={<Lazy><PermissionRoute requiredRole="SuperAdmin"><PlatformSettings /></PermissionRoute></Lazy>} />
              <Route path="tenant-master/create" element={<Lazy><PermissionRoute requiredRole="SuperAdmin"><TenantCreate /></PermissionRoute></Lazy>} />
              <Route path="tenant-master/view/:id" element={<Lazy><PermissionRoute requiredRole="SuperAdmin"><TenantView /></PermissionRoute></Lazy>} />
              <Route path="tenant-master/edit/:id" element={<Lazy><PermissionRoute requiredRole="SuperAdmin"><TenantEdit /></PermissionRoute></Lazy>} />
              <Route path="bulk-import" element={<Lazy><PermissionRoute requiredPages={['Import']}><BulkImportCenter /></PermissionRoute></Lazy>} />
              <Route path="module/import" element={<Navigate to="/bulk-import" replace />} />
              <Route path="administration/form-studio" element={<Lazy><FormStudio /></Lazy>} />
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
