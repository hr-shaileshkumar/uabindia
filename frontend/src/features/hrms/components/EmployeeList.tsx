"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { TableActionMenu, type ActionMenuItem } from "@/components/table/TableActionMenu";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import { ErpCreateButton, ErpRefreshButton, ErpRowActions } from "@/components/erp/erp-page-kit";
import { useErpListView } from "@/components/erp/erp-list-view";
import { UniversalDeleteDialog } from "@/components/erp/templates/UniversalDeleteDialog";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpStatusBadgeTone,
  erpTableRowHoverClassName,
  erpTableTdClassName,
} from "@/components/erp/erpStyles";
import { hrmsApi } from "@/services/modules";
import { ROUTES } from "@/constants/routes";
import { PERMISSIONS } from "@/constants/permissions";
import { usePermissions } from "@/context/PermissionContext";
import { RecordAiDrawer } from "@/components/ai/RecordAiDrawer";
import type { Employee } from "@/types";

export type { Employee };

const PAGE_SIZE = 15;

const statusTone = (status?: string) => {
  switch (status) {
    case "Active":
      return erpStatusBadgeTone.success;
    case "OnLeave":
      return erpStatusBadgeTone.warning;
    case "Terminated":
    case "Inactive":
      return erpStatusBadgeTone.danger;
    default:
      return erpStatusBadgeTone.neutral;
  }
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
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[]>([]);
  const [aiEmployee, setAiEmployee] = useState<Employee | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeCount = employees.filter((employee) => employee.status === "Active").length;
  const onLeaveCount = employees.filter((employee) => employee.status === "OnLeave").length;
  const inactiveCount = employees.filter(
    (employee) => employee.status === "Inactive" || employee.status === "Terminated"
  ).length;

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrmsApi.hrms.employees.list(page, PAGE_SIZE, {
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
      await hrmsApi.hrms.employees.delete(id);
      setConfirmDeleteId(null);
      setConfirmDeleteIds((current) => current.filter((item) => item !== id));
      void fetchEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete employee");
    } finally {
      setDeletingId(null);
    }
  };

  const pendingDeleteIds = confirmDeleteId ? [confirmDeleteId] : confirmDeleteIds;
  const pendingDeleteCount = pendingDeleteIds.length;

  const handleStatusToggle = async (employee: Employee) => {
    try {
      setLoading(true);
      setError(null);
      const currentStatus = employee.status ?? "Inactive";
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
      await hrmsApi.hrms.employees.update(employee.id, { status: newStatus });
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
        label: "Ask AI",
        onClick: () => setAiEmployee(employee),
      },
    ];

    if (canPunchAttendance) {
      actions.push({
        label: "Mark attendance",
        onClick: () => router.push(`${ROUTES.ATTENDANCE}?employeeId=${employee.id}`),
      });
    }

    if (canApproveLeave) {
      actions.push({
        label: "Review leave",
        onClick: () => router.push(`${ROUTES.LEAVE}?employeeId=${employee.id}`),
      });
    }

    if (canAccessDocuments) {
      actions.push({
        label: "Upload documents",
        onClick: () => router.push(`${ROUTES.ADMINISTRATION_DOCUMENTS}?employeeId=${employee.id}&module=hrms`),
      });
    }

    if (canViewPayslip) {
      actions.push({
        label: "View payslip",
        onClick: () => router.push(`${ROUTES.PAYROLL_PAYSLIPS}?employeeId=${employee.id}`),
      });
    }

    if (canEditEmployee) {
      actions.push({
        label: employee.status === "Active" ? "Mark inactive" : "Activate employee",
        onClick: () => void handleStatusToggle(employee),
      });
    }

    return actions;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void fetchEmployees();
  };

  const list = useErpListView({
    listKey: "employees",
    rows: employees,
    columns: [
      { key: "fullName", label: "Name" },
      { key: "employeeCode", label: "Code" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Actions", className: "text-right", locked: true },
    ],
    getRowId: (employee) => employee.id,
    loading,
    emptyMessage: "No employees found.",
    onCreate: canCreateEmployee ? () => router.push(`${ROUTES.EMPLOYEES}/new`) : undefined,
    createLabel: "New employee",
    onRefresh: () => void fetchEmployees(),
    onBulkDelete: canDeleteEmployee
      ? (rows) => {
          if (rows.length === 1 && rows[0]) setConfirmDeleteId(rows[0].id);
          else if (rows.length > 1) setConfirmDeleteIds(rows.map((row) => row.id));
        }
      : undefined,
    extraFilters: (
      <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-end gap-2">
        <input
          id="employee-search"
          type="search"
          placeholder="Name or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${erpFormInputClassName} min-w-48`}
        />
        <select
          id="employee-status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className={erpFormInputClassName}
        >
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="OnLeave">On leave</option>
          <option value="Terminated">Terminated</option>
        </select>
        <button type="submit" className={erpButtonClassName.secondary}>
          Search
        </button>
      </form>
    ),
    renderRow: (employee) => (
      <tr key={employee.id} className={erpTableRowHoverClassName}>
        <td className={`${erpTableTdClassName} font-medium text-slate-900`}>{employee.fullName || "—"}</td>
        <td className={erpTableTdClassName}>{employee.employeeCode || "—"}</td>
        <td className={erpTableTdClassName}>
          <span className={statusTone(employee.status)}>{employee.status || "Unknown"}</span>
        </td>
        <td className={`${erpTableTdClassName} text-right`}>
          <ErpRowActions
            onView={{
              label: "View",
              onClick: () => router.push(`${ROUTES.EMPLOYEES}/${employee.id}`),
            }}
            onEdit={
              canEditEmployee
                ? { label: "Edit", onClick: () => router.push(`${ROUTES.EMPLOYEES}/${employee.id}`) }
                : undefined
            }
            onDelete={
              canDeleteEmployee ? { label: "Delete", onClick: () => setConfirmDeleteId(employee.id) } : undefined
            }
            extra={<TableActionMenu items={getEmployeeActions(employee)} label="More" />}
          />
        </td>
      </tr>
    ),
  });

  return (
    <>
      <UniversalDeleteDialog
        open={pendingDeleteCount > 0}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDeleteId(null);
            setConfirmDeleteIds([]);
          }
        }}
        title={pendingDeleteCount > 1 ? `Delete ${pendingDeleteCount} employees` : "Delete employee"}
        entityName={pendingDeleteCount > 1 ? `${pendingDeleteCount} employees` : "this employee"}
        description="This permanently removes the selected employee record. Confirm that the employee is no longer required by dependent HR workflows."
        isHardDelete
        loading={Boolean(deletingId)}
        onConfirm={async () => {
          for (const id of pendingDeleteIds) {
            await handleDelete(id);
          }
          setConfirmDeleteIds([]);
        }}
      />

      <StandardPageLayout
        title="Employees"
        icon="users"
        meta={
          <CrudHeaderStats
            items={[
              { label: "Total", value: total, helper: "matching" },
              { label: "Active", value: activeCount, tone: "positive" },
              { label: "On leave", value: onLeaveCount, tone: "warning" },
              { label: "Inactive", value: inactiveCount, tone: "danger" },
            ]}
          />
        }
        actions={
          <>
            <ErpRefreshButton onClick={() => void fetchEmployees()} loading={loading} />
            {list.headerTools}
            {canCreateEmployee ? (
              <ErpCreateButton label="New employee" onClick={() => router.push(`${ROUTES.EMPLOYEES}/new`)} />
            ) : null}
          </>
        }
        filters={list.filterBar}
        pagination={
          !loading && totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages} · {total} total
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                  className={erpButtonClassName.secondary}
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                  className={erpButtonClassName.secondary}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null
        }
      >
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        <CrudCard>{list.table}</CrudCard>
      </StandardPageLayout>

      <RecordAiDrawer
        open={Boolean(aiEmployee)}
        onClose={() => setAiEmployee(null)}
        recordType="employee"
        recordId={aiEmployee?.id ?? ""}
        title={aiEmployee ? `Ask AI · ${aiEmployee.fullName || aiEmployee.employeeCode || "Employee"}` : "Ask AI"}
        suggestedPrompt="Summarize this employee and pending leave risk."
      />
    </>
  );
}
