"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import EmployeeList from "@/features/hrms/components/EmployeeList";
import { PERMISSIONS } from "@/constants/permissions";

export default function EmployeesMasterPage() {
  return (
    <ProtectedRoute permission={PERMISSIONS.EMPLOYEE_VIEW}>
      <EmployeeList />
    </ProtectedRoute>
  );
}
