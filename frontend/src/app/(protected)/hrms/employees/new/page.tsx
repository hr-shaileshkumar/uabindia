"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import EmployeeForm from "@/features/hrms/components/EmployeeForm";
import { PERMISSIONS } from "@/constants/permissions";

export default function NewEmployeePage() {
  return (
    <ProtectedRoute permission={PERMISSIONS.EMPLOYEE_CREATE}>
      <EmployeeForm title="Add Employee" />
    </ProtectedRoute>
  );
}
