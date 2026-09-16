import { DynamicPage } from "@/components/dynamic/DynamicPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PERMISSIONS } from "@/constants/permissions";
import EmployeeForm from "@/features/hrms/components/EmployeeForm";

function LegacyEmployeeNewPage() {
  return (
    <ProtectedRoute permission={PERMISSIONS.EMPLOYEE_CREATE}>
      <EmployeeForm title="Add Employee" />
    </ProtectedRoute>
  );
}

export default function EmployeeNewPage() {
  return (
    <DynamicPage
      pageKey="hrms.employees.new"
      fallback={<LegacyEmployeeNewPage />}
      renderMode="auto"
    />
  );
}
