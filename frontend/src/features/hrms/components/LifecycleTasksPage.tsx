"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import {
  ErpCreateButton,
  ErpDrawerFooter,
  ErpRefreshButton,
  ErpSearchFilter,
} from "@/components/erp/erp-page-kit";
import { SideDrawer } from "@/components/ui/side-drawer";
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

  const { data, isLoading, isError, error, refetch } = useQuery({
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
    [data?.employees, employeesQuery.data]
  );
  const nameOf = (id: string) => employees.find((e) => e.id === id)?.fullName ?? id;
  const filtered = tasks.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.title.toLowerCase().includes(q) || nameOf(t.employeeId).toLowerCase().includes(q);
  });

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
    [tasks, kind]
  );

  return (
    <StandardPageLayout
      title={title}
      icon="users"
      meta={<CrudHeaderStats items={stats} />}
      actions={
        <>
          <ErpRefreshButton onClick={() => void refetch()} loading={isLoading} />
          <ErpCreateButton label="New task" onClick={() => setDrawerOpen(true)} />
        </>
      }
      filters={<ErpSearchFilter value={search} onChange={setSearch} placeholder="Filter task or employee…" />}
    >
      {isError ? (
        <div className="erp-alert-error">{getApiErrorMessage(error, `Failed to load ${kind.toLowerCase()} tasks.`)}</div>
      ) : null}

      <CrudCard>
        <div className="erp-table-wrap">
          <table className="erp-table table-auto">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Employee</th>
                <th className="erp-th">Task</th>
                <th className="erp-th">Due</th>
                <th className="erp-th">Status</th>
                <th className="erp-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="erp-td py-8 text-center text-xs text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="erp-td py-8 text-center text-xs text-slate-500">
                    No {kind.toLowerCase()} tasks yet. Create a checklist item to assign work.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="erp-tr">
                    <td className="erp-td text-xs font-medium">{nameOf(row.employeeId)}</td>
                    <td className="erp-td text-xs">{row.title}</td>
                    <td className="erp-td text-xs text-slate-500">
                      {row.dueDate ? new Date(row.dueDate).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="erp-td">
                      <span className={row.status === "Completed" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
                        {row.status}
                      </span>
                    </td>
                    <td className="erp-td text-right">
                      {row.status !== "Completed" ? (
                        <button
                          type="button"
                          className="erp-action-btn erp-action-btn-secondary text-xs"
                          onClick={() => complete.mutate(row.id)}
                        >
                          Complete
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CrudCard>

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
