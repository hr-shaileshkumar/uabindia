"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import EmployeeProfile360, {
  type EmployeeProfile360Data,
} from "@/features/hrms/components/EmployeeProfile360";
import { hrmsApi } from "@/services/modules";
import { PERMISSIONS } from "@/constants/permissions";
import { ArrowLeft, Users, Search } from "lucide-react";

export default function Employee360Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEmpId = searchParams.get("id");

  const [employees, setEmployees] = useState<Array<{ id: string; fullName: string; employeeCode: string }>>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(queryEmpId ?? "");
  const [profile, setProfile] = useState<EmployeeProfile360Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load employee list for the 360 switcher
  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await hrmsApi.hrms.employees.list(1, 100);
        const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        const mapped = data.map((e: any) => ({
          id: e.id,
          fullName: e.fullName ?? e.employeeCode ?? "Unnamed",
          employeeCode: e.employeeCode ?? "",
        }));
        setEmployees(mapped);
        if (!selectedEmpId && mapped.length > 0) {
          setSelectedEmpId(mapped[0].id);
        }
      } catch (e) {
        console.error("Failed to load employee list for 360 switcher", e);
      }
    };
    void fetchList();
  }, []);

  // Load selected employee 360 profile
  useEffect(() => {
    if (!selectedEmpId) return;
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        try {
          const res = await hrmsApi.hrms.employees.getProfile360(selectedEmpId);
          if (res.data) {
            setProfile(res.data);
            return;
          }
        } catch {
          // fallback
        }

        const legacyRes = await hrmsApi.hrms.employees.getById(selectedEmpId);
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
            totalWorkingDays: 0,
            presentDays: 0,
            absentDays: 0,
            lateDays: 0,
            onLeaveDays: 0,
            totalHoursWorked: 0,
            attendanceRate: 0,
            recentLogs: [],
          },
          leaveBalances: [],
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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Employee profile not found");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [selectedEmpId]);

  return (
    <ProtectedRoute permission={PERMISSIONS.EMPLOYEE_VIEW}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Header & Employee Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/hrms/employees")}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Employee 360° Panoramic Workspace
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comprehensive 360° overview across HR, attendance, payroll, assets, and performance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="emp-select" className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
              Select Employee:
            </label>
            <select
              id="emp-select"
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName} ({e.employeeCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Profile Content */}
        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-800 dark:border-t-indigo-400" />
              <p className="text-xs font-semibold text-slate-500">Loading 360° employee data...</p>
            </div>
          </div>
        ) : error || !profile ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
            <h4 className="font-bold">Profile Unavailable</h4>
            <p className="mt-1 text-xs">{error ?? "Please select a valid employee record."}</p>
          </div>
        ) : (
          <EmployeeProfile360
            data={profile}
            onEditClick={() => router.push(`/hrms/employees?edit=${profile.id}`)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
