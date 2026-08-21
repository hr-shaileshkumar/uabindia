"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import EmployeeForm, { type EmployeeFormValues } from "@/features/hrms/components/EmployeeForm";
import DynamicFieldsSection from "@/components/DynamicFieldsSection";
import { hrmsApi } from "@/services/modules";
import { PERMISSIONS } from "@/constants/permissions";

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [initial, setInitial] = useState<Partial<EmployeeFormValues> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await hrmsApi.hrms.employees.getById(id);
        const emp = res.data;
        setInitial({
          fullName: emp.fullName ?? "",
          employeeCode: emp.employeeCode ?? "",
          companyId: emp.companyId ?? "",
          projectId: emp.projectId ?? "",
          status: emp.status ?? "Active",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Employee not found");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      </div>
    );
  }

  if (error || !initial) {
    return (
      <div className="m-6 rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {error ?? "Employee not found"}
      </div>
    );
  }

  return (
    <ProtectedRoute permission={PERMISSIONS.EMPLOYEE_VIEW}>
      <EmployeeForm
        initialValues={initial}
        employeeId={id}
        title="Edit Employee"
      />
      {/* Phase 3: Custom fields section */}
      <div className="max-w-2xl mt-6 pb-8">
        <DynamicFieldsSection
          entityName="Employee"
          recordId={id}
          editable
        />
      </div>
    </ProtectedRoute>
  );
}
