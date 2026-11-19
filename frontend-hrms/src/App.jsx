import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import AppLayout from "./layout/AppLayout";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Landing from "./pages/public/Landing";
import Pricing from "./pages/public/Pricing";
import ForgotPassword from "./pages/public/ForgotPassword";
import ResetPassword from "./pages/public/ResetPassword";

// Modules
import HRDashboard from "./modules/dashboard/HRDashboard";
import EmployeeDirectory from "./modules/employees/EmployeeDirectory";
import Employee360View from "./modules/employees/Employee360View";
import AttendanceTracker from "./modules/attendance/AttendanceTracker";
import MusterRollView from "./modules/attendance/MusterRollView";
import LeaveManagement from "./modules/leaves/LeaveManagement";
import RecruitmentDashboard from "./modules/recruitment/RecruitmentDashboard";
import AtsPipelineKanban from "./modules/recruitment/AtsPipelineKanban";
import LifecycleManagement from "./modules/lifecycle/LifecycleManagement";
import OrgStructure from "./modules/organization/OrgStructure";
import LocationHierarchy from "./modules/organization/LocationHierarchy";
import OrgChartView from "./modules/organization/OrgChartView";
import PayrollProcessing from "./modules/payroll/PayrollProcessing";
import PayslipsView from "./modules/payroll/PayslipsView";
import EmployeePortal from "./modules/selfservice/EmployeePortal";
import ManagerPortal from "./modules/selfservice/ManagerPortal";
import SchemaPageView from "./modules/dynamic/SchemaPageView";
import MessengerView from "./modules/messenger/MessengerView";

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const App = () => {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            {/* Public SaaS Pages */}
            <Route path="/" element={<Landing />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected SaaS App Shell */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/app" element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<HRDashboard />} />
              <Route path="messenger" element={<MessengerView />} />

              {/* Workforce & Core HR */}
              <Route path="employees" element={<EmployeeDirectory />} />
              <Route path="employees/360" element={<Employee360View />} />
              <Route path="lifecycle" element={<LifecycleManagement />} />
              <Route path="grades" element={<SchemaPageView pageKey="hrms.grades" />} />
              <Route path="employment-types" element={<SchemaPageView pageKey="hrms.employment-types" />} />
              <Route path="assets" element={<SchemaPageView pageKey="hrms.assets" />} />

              {/* Time & Attendance */}
              <Route path="attendance" element={<AttendanceTracker />} />
              <Route path="attendance/policy" element={<SchemaPageView pageKey="hrms.attendance-policy" />} />
              <Route path="attendance/muster-roll" element={<MusterRollView />} />
              <Route path="shifts" element={<SchemaPageView pageKey="hrms.shifts" />} />
              <Route path="overtime" element={<SchemaPageView pageKey="hrms.overtime" />} />

              {/* Leave & Absence */}
              <Route path="leave" element={<LeaveManagement />} />
              <Route path="leave/policy" element={<SchemaPageView pageKey="hrms.leave-policy" />} />
              <Route path="leaves" element={<Navigate to="/leave" replace />} />
              <Route path="leave-types" element={<SchemaPageView pageKey="hrms.leave-types" />} />

              {/* Talent Acquisition & ATS */}
              <Route path="recruitment" element={<RecruitmentDashboard />} />
              <Route path="candidates" element={<AtsPipelineKanban />} />
              <Route path="staffing-plans" element={<SchemaPageView pageKey="hrms.staffing-plans" />} />
              <Route path="screening-schedule" element={<SchemaPageView pageKey="hrms.screening-schedule" />} />
              <Route path="screening-results" element={<SchemaPageView pageKey="hrms.screening-results" />} />

              {/* Employee Lifecycle */}
              <Route path="onboarding" element={<SchemaPageView pageKey="hrms.onboarding" />} />
              <Route path="offboarding" element={<SchemaPageView pageKey="hrms.offboarding" />} />
              <Route path="probation" element={<SchemaPageView pageKey="hrms.probation" />} />
              <Route path="probation/policy" element={<SchemaPageView pageKey="hrms.probation-policy" />} />

              {/* Performance & Learning */}
              <Route path="performance" element={<SchemaPageView pageKey="hrms.performance" />} />
              <Route path="training" element={<SchemaPageView pageKey="hrms.training" />} />
              <Route path="assessments" element={<SchemaPageView pageKey="hrms.assessments" />} />
              <Route path="certificates" element={<SchemaPageView pageKey="hrms.certificates" />} />

              {/* Travel & Reimbursements */}
              <Route path="travel" element={<SchemaPageView pageKey="hrms.travel" />} />
              <Route path="travel/policy" element={<SchemaPageView pageKey="hrms.travel-policy" />} />

              {/* Organization & Hierarchy */}
              <Route path="organization" element={<OrgStructure />} />
              <Route path="locations" element={<LocationHierarchy />} />
              <Route path="org-chart" element={<OrgChartView />} />

              {/* Payroll & Compensation */}
              <Route path="payroll" element={<PayrollProcessing />} />
              <Route path="payroll/runs" element={<Navigate to="/payroll" replace />} />
              <Route path="payroll/payslips" element={<PayslipsView />} />
              <Route path="payroll/structures" element={<SchemaPageView pageKey="payroll.structures" />} />

              {/* Self-Service Portals */}
              <Route path="self-service" element={<EmployeePortal />} />
              <Route path="manager-portal" element={<ManagerPortal />} />

              {/* Fallback 404 inside layout */}
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Global fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
};

export default App;
