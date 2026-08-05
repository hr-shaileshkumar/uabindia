"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { PageHeader } from "@/design-system";
import { StatusBadge } from "@/components/erp/status-badge";
import { TableActionMenu, type ActionMenuItem } from "@/components/table/TableActionMenu";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import AdminModal from "@/components/admin/AdminModal";
import { hrApi } from "@/services/hrApi";
import { ROUTES } from "@/constants/routes";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermissions } from "@/context/PermissionContext";
import type { Employee } from "@/types";

// Re-exported for backward compatibility
export type { Employee };



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
  const activeCount = employees.filter((employee) => employee.status === "Active").length;
  const onLeaveCount = employees.filter((employee) => employee.status === "OnLeave").length;
  const inactiveCount = employees.filter((employee) => employee.status === "Inactive" || employee.status === "Terminated").length;

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
  const { hasPermission, isSuperAdmin } = usePermissions();

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
      await hrApi.hrms.employees.update(employee.id, { status: newStatus });
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
        onClick: () => router.push(`${ROUTES.ADMINISTRATION_DOCUMENTS}?employeeId=${employee.id}&module=hrms`),
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
      <AdminModal
        open={Boolean(confirmDeleteId)}
        title="Delete employee"
        subtitle="This permanently removes the selected employee record."
        type="danger"
        size="sm"
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={confirmDeleteId ? () => void handleDelete(confirmDeleteId) : undefined}
        confirmLabel="Delete employee"
        confirmLoading={Boolean(confirmDeleteId && deletingId === confirmDeleteId)}
      >
        <p className="text-sm leading-6 text-slate-600">This action cannot be undone. Confirm that the employee is no longer required by dependent HR workflows.</p>
      </AdminModal>

      <div className="erp-page space-y-5">
        <PageHeader
          title="Employee Master"
          subtitle="Manage active workforce records, lifecycle states, and HR actions from one unified employee workspace."
          eyebrow="HRMS / People Directory"
          icon="users"
          stats={[
            { label: "Employees", value: total },
            { label: "Active", value: activeCount, tone: "success" },
            { label: "On Leave", value: onLeaveCount, tone: "warning" },
            { label: "Inactive", value: inactiveCount, tone: "danger" },
          ]}
          actions={
            canCreateEmployee ? (
              <button
                type="button"
                onClick={() => router.push(`${ROUTES.EMPLOYEES}/new`)}
                className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm"
              >
                + Add Employee
              </button>
            ) : null
          }
        />
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_auto]">
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium text-slate-600">Search</label>
            <input
              type="search"
              placeholder="Name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
            >
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="OnLeave">On Leave</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>
          <button type="submit" className="erp-action-btn erp-action-btn-secondary">
            Search
          </button>
          {(search || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setPage(1);
              }}
              className="erp-action-btn erp-action-btn-secondary"
            >
              Clear
            </button>
          )}
        </form>
      </div>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}
        <CrudCard title="Employee Directory" description="Keep the employee master dense. Open profile, lifecycle, attendance, and payroll actions from the same grid.">
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
                    No employees found.{" "}
                    <Link href={`${ROUTES.EMPLOYEES}/new`} className="text-blue-600 underline">
                      Add the first one.
                    </Link>
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{employee.fullName || "-"}</td>
                    <td className="px-5 py-3 text-slate-500">{employee.employeeCode || "-"}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_BADGE[employee.status ?? ""] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {employee.status || "Unknown"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <TableActionMenu items={getEmployeeActions(employee)} label="Actions" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </CrudCard>

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">
              Showing page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                className="erp-action-btn erp-action-btn-secondary disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                className="erp-action-btn erp-action-btn-secondary disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
