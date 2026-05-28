"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { TableActionMenu, type ActionMenuItem } from "@/components/table/TableActionMenu";
import { hrApi } from "@/services/hrApi";
import { ROUTES } from "@/constants/routes";
import { PERMISSIONS } from "@/constants/permissions";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/context/PermissionContext";

export type Employee = {
  id: string;
  fullName?: string;
  employeeCode?: string;
  companyId?: string;
  projectId?: string;
  status?: string;
};

const PAGE_SIZE = 15;

const STATUS_BADGE: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Inactive: "bg-gray-100 text-gray-600",
  Terminated: "bg-red-100 text-red-600",
  OnLeave: "bg-amber-100 text-amber-700",
};

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrApi.hrms.employees.list(page, PAGE_SIZE, {
        search: search || undefined,
        status: statusFilter || undefined,
      });
      const raw = res.data;
      const list: Employee[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.employees)
        ? raw.employees
        : [];
      setEmployees(list);
      setTotal(raw?.total ?? list.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    void fetchEmployees();
  }, [fetchEmployees]);

  const router = useRouter();
  const { user } = useAuth();
  const { hasPermission, isSuperAdmin } = usePermissions();

  const userRoles = user?.roles ?? [];
  const isHrManager = userRoles.some((role) => /hr/i.test(role ?? ""));

  const canCreateEmployee = isSuperAdmin || hasPermission([PERMISSIONS.EMPLOYEE_CREATE]);
  const canEditEmployee = isSuperAdmin || hasPermission([PERMISSIONS.EMPLOYEE_EDIT]);
  const canDeleteEmployee = isSuperAdmin || hasPermission([PERMISSIONS.EMPLOYEE_DELETE]);
  const canApproveLeave = isSuperAdmin || hasPermission([PERMISSIONS.LEAVE_APPROVE]);
  const canPunchAttendance = isSuperAdmin || hasPermission([PERMISSIONS.ATTENDANCE_CREATE]);
  const canAccessDocuments = isSuperAdmin || hasPermission([PERMISSIONS.DOCUMENTS_VIEW]);
  const canViewPayslip = isSuperAdmin || hasPermission([PERMISSIONS.PAYROLL_PAYSLIPS_VIEW]);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await hrApi.hrms.employees.delete(id);
      setConfirmDeleteId(null);
      void fetchEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete employee");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusToggle = async (employee: Employee) => {
    try {
      setLoading(true);
      setError(null);
      const currentStatus = employee.status ?? "Inactive";
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
      await hrApi.hrms.employees.update(employee.id, {
        status: newStatus,
      });
      void fetchEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update employee status");
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeActions = (employee: Employee): ActionMenuItem[] => {
    const actions: ActionMenuItem[] = [
      {
        label: "View Profile",
        onClick: () => router.push(`${ROUTES.EMPLOYEES}/${employee.id}`),
      },
    ];

    if (canEditEmployee) {
      actions.push({
        label: "Edit Employee",
        onClick: () => router.push(`${ROUTES.EMPLOYEES}/${employee.id}`),
      });
    }

    if (canPunchAttendance) {
      actions.push({
        label: "Mark Attendance",
        onClick: () => router.push(`${ROUTES.ATTENDANCE}?employeeId=${employee.id}`),
      });
    }

    if (canApproveLeave) {
      actions.push({
        label: "Approve / Review Leave",
        onClick: () => router.push(`${ROUTES.LEAVE}?employeeId=${employee.id}`),
      });
    }

    if (canAccessDocuments) {
      actions.push({
        label: "Upload Documents",
        onClick: () => router.push(`${ROUTES.DOCUMENTS}?employeeId=${employee.id}&module=hrms`),
      });
    }

    if (canViewPayslip) {
      actions.push({
        label: "View Payslip",
        onClick: () => router.push(`${ROUTES.PAYROLL_PAYSLIPS}?employeeId=${employee.id}`),
      });
    }

    if (canEditEmployee) {
      actions.push({
        label: employee.status === "Active" ? "Mark Inactive" : "Activate Employee",
        onClick: () => void handleStatusToggle(employee),
      });
    }

    if (canDeleteEmployee) {
      actions.push({
        label: "Delete Employee",
        onClick: () => setConfirmDeleteId(employee.id),
        danger: true,
      });
    }

    return actions;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void fetchEmployees();
  };

  return (
    <>
      {confirmDeleteId && (
        <div className="erp-modal-backdrop" onClick={() => setConfirmDeleteId(null)}>
          <div className="erp-modal-card erp-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-accent erp-modal-accent-danger" />
            <div className="erp-modal-header">
              <div className="flex min-w-0 items-center gap-3">
                <span className="erp-modal-icon erp-modal-icon-danger">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </span>
                <div className="erp-modal-title">Delete Employee</div>
              </div>
              <button type="button" onClick={() => setConfirmDeleteId(null)} className="erp-modal-close">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="erp-modal-body">
              <p className="text-sm text-slate-600">Are you sure you want to delete this employee? This action cannot be undone.</p>
            </div>
            <div className="erp-modal-footer">
              <button type="button" onClick={() => setConfirmDeleteId(null)} className="erp-action-btn erp-action-btn-secondary">Cancel</button>
              <button type="button" onClick={() => void handleDelete(confirmDeleteId)} disabled={deletingId === confirmDeleteId} className="erp-action-btn erp-action-btn-danger disabled:opacity-50">
                {deletingId === confirmDeleteId ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <StandardPageLayout
        title="Employee Master"
        subtitle="Manage your organization's employees"
        actions={
          canCreateEmployee ? (
            <Link
              href={`${ROUTES.EMPLOYEES}/new`}
              className="erp-action-btn erp-action-btn-primary"
            >
              + Add Employee
            </Link>
          ) : null
        }
        filters={
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="flex-1 min-w-48">
              <label className="mb-1 block text-xs font-medium text-slate-600">Search</label>
              <input
                type="search"
                placeholder="Name or code…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div className="w-36">
              <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              >
                <option value="">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="OnLeave">On Leave</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
            <button
              type="submit"
              className="erp-action-btn erp-action-btn-secondary"
            >
              Search
            </button>
            {(search || statusFilter) && (
              <button
                type="button"
                onClick={() => { setSearch(""); setStatusFilter(""); setPage(1); }}
                className="erp-action-btn erp-action-btn-secondary"
              >
                Clear
              </button>
            )}
          </form>
        }
      >
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {/* KPI summary cards */}
        <div className="erp-kpi-grid mb-4">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Employees</p><p className="erp-kpi-value">{total}</p><p className="erp-kpi-meta">All workforce records</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Active</p><p className="erp-kpi-value erp-kpi-value-success">{employees.filter(e => e.status === 'Active').length}</p><p className="erp-kpi-meta">Current page active</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">On Leave</p><p className="erp-kpi-value">{employees.filter(e => e.status === 'OnLeave').length}</p><p className="erp-kpi-meta">Currently on leave</p></div>
          <div className="erp-kpi-card erp-kpi-card-danger"><p className="erp-kpi-label">Inactive / Terminated</p><p className="erp-kpi-value erp-kpi-value-danger">{employees.filter(e => e.status === 'Inactive' || e.status === 'Terminated').length}</p><p className="erp-kpi-meta">Not in service</p></div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Code</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-5 py-3">
                      <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                    No employees found. {" "}
                    <Link href={`${ROUTES.EMPLOYEES}/new`} className="text-blue-600 underline">
                      Add the first one.
                    </Link>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {emp.fullName || "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{emp.employeeCode || "—"}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_BADGE[emp.status ?? ""] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {emp.status || "Unknown"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <TableActionMenu items={getEmployeeActions(emp)} label="Actions" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">
              Showing page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="erp-action-btn erp-action-btn-secondary disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="erp-action-btn erp-action-btn-secondary disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </StandardPageLayout>
    </>
  );
}
