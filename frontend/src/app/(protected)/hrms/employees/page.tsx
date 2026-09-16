import { DynamicPage } from "@/components/dynamic/DynamicPage";
import EmployeeList from "@/features/hrms/components/EmployeeList";

export default function EmployeesPage() {
  return (
    <DynamicPage
      pageKey="hrms.employees"
      fallback={<EmployeeList />}
      renderMode="auto"
    />
  );
}
