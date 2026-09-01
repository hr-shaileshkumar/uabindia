"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { StatusBadge } from "@/components/workspace/status-badge";
import {
  ErpCreateButton,
  ErpDrawerFooter,
  ErpRefreshButton,
  ErpRowActions,
} from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { SideDrawer } from "@/components/ui/side-drawer";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpFormLabelClassName,
} from "@/components/workspace/styles";
import { ListSearchInput, ListStatusFilter } from "@/components/workspace/list-toolbar";
import { hrmsApi, orgApi, projectsApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";

export type TimesheetRow = {
  id: string;
  employeeId?: string;
  employeeName: string;
  projectId: string;
  projectTaskId?: string;
  workDate: string;
  hours: number;
  status: string;
  notes?: string;
};

export type Option = { id: string; name: string };

const emptyForm = () => ({
  employeeId: "",
  projectId: "",
  projectTaskId: "",
  workDate: new Date().toISOString().slice(0, 10),
  hours: "8",
  notes: "",
  submitNow: true,
});

export function TimesheetsManager() {
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [projects, setProjects] = useState<Option[]>([]);
  const [employees, setEmployees] = useState<Option[]>([]);
  const [tasks, setTasks] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState(emptyForm());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [tsRes, projectsRes, empRes] = await Promise.all([
        projectsApi.timesheets.getAll(1, 100),
        orgApi.project.getAll(),
        hrmsApi.hrms.employees.list(1, 100),
      ]);
      const raw = tsRes.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      setRows(
        list.map((t: Record<string, unknown>) => ({
          id: String(t.id),
          employeeId: t.employeeId ? String(t.employeeId) : undefined,
          employeeName: String(t.employeeName ?? ""),
          projectId: String(t.projectId ?? ""),
          projectTaskId: t.projectTaskId ? String(t.projectTaskId) : undefined,
          workDate: String(t.workDate ?? "").slice(0, 10),
          hours: Number(t.hours ?? 0),
          status: String(t.status ?? "Draft"),
          notes: t.notes ? String(t.notes) : undefined,
        })),
      );

      const projList = Array.isArray(projectsRes.data?.projects) ? projectsRes.data.projects : [];
      setProjects(projList.map((p) => ({ id: String(p.id), name: String(p.name ?? p.projectCode ?? p.id) })));

      const empRaw = empRes.data;
      const empList: { id: string; firstName?: string; lastName?: string; name?: string }[] = Array.isArray(empRaw)
        ? empRaw
        : Array.isArray(empRaw?.employees)
          ? empRaw.employees
          : [];
      setEmployees(
        empList.map((e) => ({
          id: String(e.id),
          name: e.name || [e.firstName, e.lastName].filter(Boolean).join(" ") || String(e.id).slice(0, 8),
        })),
      );
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to load timesheets."), "Projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!form.projectId) {
      setTasks([]);
      return;
    }
    void (async () => {
      try {
        const res = await projectsApi.tasks.getAll(1, 100, form.projectId);
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
        setTasks(list.map((t: Record<string, unknown>) => ({ id: String(t.id), name: String(t.title ?? t.taskCode ?? t.id) })));
      } catch {
        setTasks([]);
      }
    })();
  }, [form.projectId]);

  const projectName = useCallback(
    (id: string) => projects.find((p) => p.id === id)?.name ?? id.slice(0, 8),
    [projects],
  );

  const handleCreate = async () => {
    if (!form.employeeId || !form.projectId || !form.hours) {
      notifyError("Employee, project, and hours are required.");
      return;
    }
    try {
      setSaving(true);
      const emp = employees.find((e) => e.id === form.employeeId);
      await projectsApi.timesheets.create({
        employeeId: form.employeeId,
        employeeName: emp?.name,
        projectId: form.projectId,
        projectTaskId: form.projectTaskId || undefined,
        workDate: form.workDate,
        hours: Number(form.hours),
        notes: form.notes.trim() || undefined,
        status: form.submitNow ? "Submitted" : "Draft",
      });
      notifySuccess(form.submitNow ? "Timesheet submitted." : "Timesheet saved as draft.", "Projects");
      setDrawerOpen(false);
      setForm(emptyForm());
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save timesheet."), "Projects");
    } finally {
      setSaving(false);
    }
  };

  const submitDraft = async (id: string) => {
    try {
      await projectsApi.timesheets.submit(id);
      notifySuccess("Timesheet submitted.", "Projects");
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Submit failed."), "Projects");
    }
  };

  const approve = async (id: string) => {
    try {
      await projectsApi.timesheets.approve(id);
      notifySuccess("Timesheet approved.", "Projects");
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Approve failed."), "Projects");
    }
  };

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        r.employeeName.toLowerCase().includes(q) ||
        projectName(r.projectId).toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || r.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter, projectName]);

  const listRows = useMemo(
    () => filtered.map((row) => ({ ...row, projectName: projectName(row.projectId) })),
    [filtered, projectName],
  );

  const tone = (status: string) => {
    const s = status.toLowerCase();
    if (s === "approved") return "positive" as const;
    if (s === "submitted") return "warning" as const;
    if (s === "rejected") return "danger" as const;
    return "neutral" as const;
  };

  const totalHours = filtered.reduce((sum, r) => sum + r.hours, 0);

  const list = useErpListView({
    listKey: "project-timesheets",
    rows: listRows,
    columns: [
      { key: "employeeName", label: "Employee" },
      { key: "projectName", label: "Project" },
      { key: "workDate", label: "Date", dataType: "date" },
      { key: "hours", label: "Hours" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Actions", className: "text-right", locked: true },
    ],
    getRowId: (row) => row.id,
    loading,
    emptyMessage: "Log hours against a project (and optional task) to start tracking delivery effort.",
    onCreate: () => setDrawerOpen(true),
    createLabel: "Log time",
    onRefresh: () => void load(),
    extraFilters: (
      <>
        <ListSearchInput value={search} onChange={setSearch} placeholder="Search employee or project…" />
        <ListStatusFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: "All statuses", value: "all" },
            { label: "Draft", value: "draft" },
            { label: "Submitted", value: "submitted" },
            { label: "Approved", value: "approved" },
          ]}
        />
      </>
    ),
    renderRow: (row) => (
      <tr key={row.id} className="erp-tr hover:bg-[var(--bg-muted)]/60">
        <td className="erp-td text-xs font-semibold text-slate-900 dark:text-white">{row.employeeName || "Employee"}</td>
        <td className="erp-td text-xs text-slate-600 dark:text-slate-400">{row.projectName}</td>
        <td className="erp-td text-xs text-slate-600 dark:text-slate-400">{row.workDate}</td>
        <td className="erp-td text-xs font-medium text-slate-900 dark:text-white">{row.hours}h</td>
        <td className="erp-td">
          <StatusBadge tone={tone(row.status)}>{row.status}</StatusBadge>
        </td>
        <td className="erp-td text-right">
          <ErpRowActions
            extra={
              <>
                {row.status === "Draft" ? (
                  <button
                    type="button"
                    className={`${erpButtonClassName.secondary} h-8 px-3 text-xs cursor-pointer`}
                    onClick={() => void submitDraft(row.id)}
                  >
                    Submit
                  </button>
                ) : null}
                {row.status === "Submitted" ? (
                  <button
                    type="button"
                    className={`${erpButtonClassName.primary} h-8 px-3 text-xs cursor-pointer`}
                    onClick={() => void approve(row.id)}
                  >
                    Approve
                  </button>
                ) : null}
              </>
            }
          />
        </td>
      </tr>
    ),
  });

  return (
    <StandardPageLayout
      title="Timesheets"
      subtitle="Log hours against projects and tasks for delivery and cost tracking."
      eyebrow="Projects & Operations / Timesheets"
      icon="clock"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Entries", value: rows.length },
            { label: "Hours", value: totalHours, helper: "filtered" },
            { label: "Submitted", value: rows.filter((r) => r.status === "Submitted").length, tone: "warning" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          {list.headerTools}
          <ErpCreateButton label="Log time" onClick={() => setDrawerOpen(true)} />
        </>
      }
      filters={list.filterBar}
    >
      <CrudCard>{list.table}</CrudCard>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Log timesheet"
        subtitle="Persists to /api/v1/timesheets"
        footer={
          <ErpDrawerFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={() => void handleCreate()}
            saving={saving}
            saveLabel={form.submitNow ? "Submit" : "Save draft"}
          />
        }
      >
        <div className="space-y-4">
          <div>
            <label className={erpFormLabelClassName}>Employee *</label>
            <select
              className={`${erpFormInputClassName} mt-1`}
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            >
              <option value="">Select employee…</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={erpFormLabelClassName}>Project *</label>
            <select
              className={`${erpFormInputClassName} mt-1`}
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value, projectTaskId: "" })}
            >
              <option value="">Select project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={erpFormLabelClassName}>Task (optional)</label>
            <select
              className={`${erpFormInputClassName} mt-1`}
              value={form.projectTaskId}
              onChange={(e) => setForm({ ...form, projectTaskId: e.target.value })}
              disabled={!form.projectId}
            >
              <option value="">No task</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={erpFormLabelClassName}>Work date</label>
              <input type="date" className={`${erpFormInputClassName} mt-1`} value={form.workDate} onChange={(e) => setForm({ ...form, workDate: e.target.value })} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Hours</label>
              <input type="number" min={0.25} step={0.25} className={`${erpFormInputClassName} mt-1`} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={erpFormLabelClassName}>Notes</label>
            <textarea className={`${erpFormInputClassName} mt-1`} rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={form.submitNow} onChange={(e) => setForm({ ...form, submitNow: e.target.checked })} />
            Submit for approval immediately
          </label>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}

export default TimesheetsManager;
