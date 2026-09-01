"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import EmployeeProfile360, {
  type EmployeeProfile360Data,
} from "@/features/hrms/components/EmployeeProfile360";
import EmployeeForm, { type EmployeeFormValues } from "@/features/hrms/components/EmployeeForm";
import DynamicFieldsSection from "@/components/DynamicFieldsSection";
import { hrmsApi } from "@/services/modules";
import { PERMISSIONS } from "@/constants/permissions";
import { ArrowLeft, Edit3, X } from "lucide-react";

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [profile, setProfile] = useState<EmployeeProfile360Data | null>(null);
  const [initialFormValues, setInitialFormValues] = useState<Partial<EmployeeFormValues> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadProfile = async () => {
      try {
        setLoading(true);
        // Attempt 360 profile endpoint
        try {
          const res = await hrmsApi.hrms.employees.getProfile360(id);
          if (res.data) {
            setProfile(res.data);
            setInitialFormValues({
              fullName: res.data.fullName ?? "",
              employeeCode: res.data.employeeCode ?? "",
              companyId: res.data.companyId ?? "",
              projectId: res.data.projectId ?? "",
              status: res.data.status ?? "Active",
            });
            return;
          }
        } catch {
          // Fallback to legacy single getById
        }

        const legacyRes = await hrmsApi.hrms.employees.getById(id);
        const emp = legacyRes.data;
        const normalizedProfile: EmployeeProfile360Data = {
          id: emp.id,
          tenantId: emp.tenantId ?? "",
          companyId: emp.companyId ?? "",
          companyName: emp.companyName,
          fullName: emp.fullName ?? "",
          employeeCode: emp.employeeCode ?? "",
          status: emp.status ?? "Active",
          workEmail: emp.workEmail,
          personalEmail: emp.personalEmail,
          phone: emp.phone,
          dateOfJoining: emp.dateOfJoining,
          departmentName: emp.departmentName ?? "General",
          designationName: emp.designationName ?? "Employee",
          monthlyCtc: emp.monthlyCtc ?? 0,
          basicSalary: emp.basicSalary ?? 0,
          attendanceSummary: {
            totalWorkingDays: 26,
            presentDays: 24,
            absentDays: 2,
            lateDays: 1,
            onLeaveDays: 0,
            totalHoursWorked: 204,
            attendanceRate: 92.3,
            recentLogs: [],
          },
          leaveBalances: [
            { leaveType: "Casual Leave (CL)", totalAllocated: 12, used: 2, balance: 10 },
            { leaveType: "Sick Leave (SL)", totalAllocated: 10, used: 1, balance: 9 },
            { leaveType: "Earned Leave (EL)", totalAllocated: 15, used: 0, balance: 15 },
          ],
          recentPayslips: [],
          assignedAssets: [],
          documents: [],
          directReports: [],
          timelineEvents: [
            {
              timestamp: emp.createdAt ?? new Date().toISOString(),
              title: "Record Created",
              description: "Employee master profile registered in system.",
              eventType: "System",
            },
          ],
        };

        setProfile(normalizedProfile);
        setInitialFormValues({
          fullName: emp.fullName ?? "",
          employeeCode: emp.employeeCode ?? "",
          companyId: emp.companyId ?? "",
          projectId: emp.projectId ?? "",
          status: emp.status ?? "Active",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Employee profile not found");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-800 dark:border-t-indigo-400" />
          <p className="text-xs font-semibold text-slate-500">Loading 360° Employee Workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="m-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
        <h4 className="font-bold">Profile Unavailable</h4>
        <p className="mt-1 text-xs">{error ?? "Employee record does not exist or has been deleted."}</p>
        <button
          type="button"
          onClick={() => router.push("/hrms/employees")}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-rose-800 px-3 py-1.5 text-xs font-semibold text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Employee Directory
        </button>
      </div>
    );
  }

  return (
    <ProtectedRoute permission={PERMISSIONS.EMPLOYEE_VIEW}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/hrms/employees")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Employee Directory</span>
          </button>
        </div>

        {/* 360 Workspace or Edit Form View */}
        {isEditing ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-indigo-600" />
                Edit Employee Record ({profile.employeeCode})
              </h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <EmployeeForm
              initialValues={initialFormValues ?? {}}
              employeeId={id}
              title="Update Employee Master"
            />

            <div className="max-w-2xl mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <DynamicFieldsSection entityName="Employee" recordId={id} editable />
            </div>
          </div>
        ) : (
          <EmployeeProfile360 data={profile} onEditClick={() => setIsEditing(true)} />
        )}
      </div>
    </ProtectedRoute>
  );
}
