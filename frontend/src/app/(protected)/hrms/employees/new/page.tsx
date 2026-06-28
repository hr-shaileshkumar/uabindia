import ProtectedRoute from "@/components/ProtectedRoute";
import { PERMISSIONS } from "@/constants/permissions";
import EmployeeForm from "@/features/hrms/components/EmployeeForm";

export default function EmployeeNewPage() {
  return (
    <ProtectedRoute permission={PERMISSIONS.EMPLOYEE_CREATE}>
      <EmployeeForm title="Add Employee" />
    </ProtectedRoute>
  );
}
