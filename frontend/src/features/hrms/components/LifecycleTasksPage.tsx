"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import {
  ErpCreateButton,
  ErpDrawerFooter,
  ErpRefreshButton,
  ErpRowActions,
  ErpSearchFilter,
} from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { SideDrawer } from "@/components/ui/side-drawer";
import { erpButtonClassName, erpTableRowHoverClassName, erpTableTdClassName } from "@/components/workspace/styles";
import { getApiErrorMessage } from "@/lib/api-errors";
import { hrmsApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";

type LifecycleTask = {
  id: string;
  employeeId: string;
  title: string;
  status: string;
  category?: string;
  dueDate?: string;
  employeeName?: string;
};

type EmployeeOpt = { id: string; fullName?: string; employeeCode?: string };

type LifecycleTasksPageProps = {
  kind: "Onboarding" | "Offboarding";
  title: string;
  queryKey: string;
};

export default function LifecycleTasksPage({ kind, title, queryKey }: LifecycleTasksPageProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<{
    employeeId: string;
    title: string;
    category: string;
    dueDate: string;
  }>({
    employeeId: "",
    title: "",
    category: kind,
    dueDate: "",
  });

  const listKey = `hrms-lifecycle-${kind.toLowerCase()}`;

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["hrms", queryKey],
    queryFn: async () => {
      const res = await hrmsApi.lifecycle.tasks(kind);
      return res.data as { tasks?: LifecycleTask[]; employees?: EmployeeOpt[] };
    },
  });

  const employeesQuery = useQuery({
    queryKey: ["hrms", "employees-lite"],
    queryFn: async () => {
      const res = await hrmsApi.hrms.employees.list(1, 100);
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as { data?: unknown })?.data)
          ? ((raw as { data: unknown[] }).data)
          : [];
      return (list as Record<string, unknown>[]).map((e) => ({
        id: String(e.id),
        fullName: String(
          e.fullName ??
            (`${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.employeeCode || e.id)
        ),
        employeeCode: e.employeeCode ? String(e.employeeCode) : undefined,
      })) as EmployeeOpt[];
    },
  });

  const complete = useMutation({
    mutationFn: (id: string) => hrmsApi.lifecycle.completeTask(id),
    onSuccess: () => {
      notifySuccess("Task marked complete.");
      void queryClient.invalidateQueries({ queryKey: ["hrms", queryKey] });
    },
    onError: (err) => notifyError(getApiErrorMessage(err, "Could not complete task.")),
  });

  const create = useMutation({
    mutationFn: () =>
      hrmsApi.lifecycle.createTask({
        kind,
        employeeId: form.employeeId,
        title: form.title,
        category: form.category || kind,
        dueDate: form.dueDate || undefined,
        status: "Pending",
      }),
    onSuccess: () => {
      notifySuccess("Task created.");
      setDrawerOpen(false);
      setForm({ employeeId: "", title: "", category: kind, dueDate: "" });
      void queryClient.invalidateQueries({ queryKey: ["hrms", queryKey] });
    },
    onError: (err) => notifyError(getApiErrorMessage(err, "Could not create task.")),
  });

  const tasks = useMemo(() => data?.tasks ?? [], [data?.tasks]);
  const employees = useMemo(
    () => (data?.employees?.length ? data.employees : employeesQuery.data) ?? [],
    [data?.employees, employeesQuery.data],
  );
  const nameOf = (id: string) => employees.find((e) => e.id === id)?.fullName ?? id;

  const rows = useMemo(
    () =>
      tasks
        .filter((t) => {
          const q = search.toLowerCase();
          return !q || t.title.toLowerCase().includes(q) || nameOf(t.employeeId).toLowerCase().includes(q);
        })
        .map((task) => ({
          ...task,
          employeeName: nameOf(task.employeeId),
          dueLabel: task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-IN") : "—",
        })),
    [tasks, search, employees],
  );

  const stats = useMemo(
    () => [
      { label: "Open tasks", value: tasks.filter((t) => t.status !== "Completed").length, tone: "warning" as const },
      { label: "Completed", value: tasks.filter((t) => t.status === "Completed").length, tone: "positive" as const },
      {
        label: kind === "Onboarding" ? "Joiners" : "Exits",
        value: new Set(tasks.map((t) => t.employeeId)).size,
        tone: kind === "Onboarding" ? ("info" as const) : ("danger" as const),
      },
    ],
    [tasks, kind],
  );

  const list = useErpListView({
    listKey,
    rows,
    columns: [
      { key: "employeeName", label: "Employee" },
      { key: "title", label: "Task" },
      { key: "dueLabel", label: "Due" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Actions", className: "text-right", locked: true },
    ],
    getRowId: (row) => row.id,
    loading: isLoading,
    emptyMessage: `No ${kind.toLowerCase()} tasks yet. Create a checklist item to assign work.`,
    onCreate: () => setDrawerOpen(true),
    createLabel: "New task",
    onRefresh: () => void refetch(),
    extraFilters: (
      <ErpSearchFilter value={search} onChange={setSearch} placeholder="Filter task or employee…" />
    ),
    renderRow: (row) => (
      <tr key={row.id} className={erpTableRowHoverClassName}>
        <td className={`${erpTableTdClassName} text-xs font-medium`}>{row.employeeName}</td>
        <td className={`${erpTableTdClassName} text-xs`}>{row.title}</td>
        <td className={`${erpTableTdClassName} text-xs text-slate-500`}>{row.dueLabel}</td>
        <td className={erpTableTdClassName}>
          <span className={row.status === "Completed" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
            {row.status}
          </span>
        </td>
        <td className={`${erpTableTdClassName} text-right`}>
          <ErpRowActions
            extra={
              row.status !== "Completed" ? (
                <button
                  type="button"
                  className={`${erpButtonClassName.secondary} h-8 px-2 text-xs`}
                  onClick={() => complete.mutate(row.id)}
                >
                  Complete
                </button>
              ) : null
            }
          />
        </td>
      </tr>
    ),
  });

  return (
    <StandardPageLayout
      title={title}
      icon="users"
      meta={<CrudHeaderStats items={stats} />}
      actions={
        <>
          <ErpRefreshButton onClick={() => void refetch()} loading={isLoading || isFetching} />
          {list.headerTools}
          <ErpCreateButton label="New task" onClick={() => setDrawerOpen(true)} />
        </>
      }
      filters={list.filterBar}
    >
      {isError ? (
        <div className="erp-alert-error">{getApiErrorMessage(error, `Failed to load ${kind.toLowerCase()} tasks.`)}</div>
      ) : null}

      <CrudCard>{list.table}</CrudCard>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={`New ${kind.toLowerCase()} task`}
        footer={
          <ErpDrawerFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={() => {
              if (!form.employeeId || !form.title.trim()) {
                notifyError("Employee and title are required.");
                return;
              }
              create.mutate();
            }}
            saving={create.isPending}
            saveLabel="Create"
          />
        }
      >
        <div className="erp-form-grid">
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Employee</label>
            <select
              className="erp-input"
              value={form.employeeId}
              onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
            >
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName}
                  {e.employeeCode ? ` (${e.employeeCode})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Task title</label>
            <input
              className="erp-input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={kind === "Onboarding" ? "Collect ID proof" : "Return laptop"}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Category</label>
            <input
              className="erp-input"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Due date</label>
            <input
              type="date"
              className="erp-input"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </div>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}
