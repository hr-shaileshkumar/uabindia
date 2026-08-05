"use client";

import { useAuth } from "@/context/AuthContext";
import { isSuperAdminRole } from "@/lib/auth/role-utils";
import { DashboardPage } from "@/components/erp/dashboard-page";
import { SuperAdminDashboard } from "@/features/dashboard/components/SuperAdminDashboard";
import { EmployeeDashboard } from "@/features/dashboard/components/EmployeeDashboard";

export default function ERPDashboardRoute() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() || "";

  if (isSuperAdminRole(user?.role)) {
    return <SuperAdminDashboard />;
  }

  if (role === "employee" || role === "ess") {
    return <EmployeeDashboard />;
  }

  return <DashboardPage />;
}
