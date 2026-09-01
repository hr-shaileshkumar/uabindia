"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutGrid,
  List,
  Plus,
  Clock,
  Calendar,
  MoreVertical,
  FolderKanban,
} from "lucide-react";
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
import { UniversalDeleteDialog } from "@/components/workspace/templates/UniversalDeleteDialog";
import {
  erpFormInputClassName,
  erpFormLabelClassName,
} from "@/components/workspace/styles";
import { ListSearchInput, ListStatusFilter } from "@/components/workspace/list-toolbar";
import { orgApi, projectsApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";

export type TaskRow = {
  id: string;
  taskCode: string;
  title: string;
  description?: string;
  projectId: string;
  status: string;
  assignedToName?: string;
  estimatedHours?: number;
  dueDate?: string;
};

export type ProjectOption = { id: string; name: string };

const KANBAN_COLUMNS = [
  { key: "Open", label: "To Do / Backlog", tone: "neutral", dotColor: "bg-slate-400" },
  { key: "InProgress", label: "In Progress", tone: "warning", dotColor: "bg-amber-500" },
  { key: "Review", label: "Under Review", tone: "info", dotColor: "bg-blue-500" },
  { key: "Done", label: "Completed", tone: "positive", dotColor: "bg-emerald-500" },
];

const emptyForm = () => ({
  projectId: "",
  title: "",
  description: "",
  status: "Open",
  estimatedHours: "8",
  dueDate: "",
  assignedToName: "",
});

export function ProjectTasksManager() {
  const [rows, setRows] = useState<TaskRow[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState(emptyForm());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [tasksRes, projectsRes] = await Promise.all([
        projectsApi.tasks.getAll(1, 100),
        orgApi.project.getAll(),
      ]);
      const taskRaw = tasksRes.data;
      const taskList = Array.isArray(taskRaw) ? taskRaw : Array.isArray(taskRaw?.data) ? taskRaw.data : [];
      setRows(
        taskList.map((t: Record<string, unknown>) => ({
          id: String(t.id),
          taskCode: String(t.taskCode ?? ""),
          title: String(t.title ?? ""),
          description: t.description ? String(t.description) : undefined,
          projectId: String(t.projectId ?? ""),
          status: String(t.status ?? "Open"),
          assignedToName: t.assignedToName ? String(t.assignedToName) : undefined,
          estimatedHours: t.estimatedHours != null ? Number(t.estimatedHours) : undefined,
          dueDate: t.dueDate ? String(t.dueDate).slice(0, 10) : undefined,
        })),
      );

      const projRaw = projectsRes.data;
      const projList = Array.isArray(projRaw?.projects) ? projRaw.projects : [];
      setProjects(
        projList.map((p) => ({
          id: String(p.id),
          name: String(p.name ?? p.projectCode ?? p.id),
        })),
      );
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to load project tasks."), "Projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const projectName = useCallback(
    (id: string) => projects.find((p) => p.id === id)?.name ?? id.slice(0, 8),
    [projects],
  );

  const openCreate = (initialStatus?: string) => {
    setEditingId(null);
    setForm({
      ...emptyForm(),
      status: initialStatus || "Open",
      projectId: projects[0]?.id || "",
    });
    setDrawerOpen(true);
  };

  const openEdit = (row: TaskRow) => {
    setEditingId(row.id);
    setForm({
      projectId: row.projectId,
      title: row.title,
      description: row.description ?? "",
      status: row.status,
      estimatedHours: row.estimatedHours != null ? String(row.estimatedHours) : "8",
      dueDate: row.dueDate ?? "",
      assignedToName: row.assignedToName ?? "",
    });
    setDrawerOpen(true);
  };

  const handleQuickStatusChange = async (taskId: string, newStatus: string) => {
    const task = rows.find((r) => r.id === taskId);
    if (!task) return;

    // Optimistic UI update
    setRows((prev) => prev.map((r) => (r.id === taskId ? { ...r, status: newStatus } : r)));

    try {
      await projectsApi.tasks.update(taskId, {
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        estimatedHours: task.estimatedHours,
        dueDate: task.dueDate,
        status: newStatus,
        assignedToName: task.assignedToName,
      });
      notifySuccess(`Task moved to ${newStatus}.`, "Projects");
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to update task status."), "Projects");
      void load();
    }
  };

  const handleSave = async () => {
    if (!form.projectId || !form.title.trim()) {
      notifyError("Project and title are required.", "Projects");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        projectId: form.projectId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
        dueDate: form.dueDate || undefined,
        status: form.status,
        assignedToName: form.assignedToName.trim() || undefined,
      };
      if (editingId) {
        await projectsApi.tasks.update(editingId, payload);
        notifySuccess("Task updated.", "Projects");
      } else {
        await projectsApi.tasks.create(payload);
        notifySuccess("Task created.", "Projects");
      }
      setDrawerOpen(false);
      setEditingId(null);
      setForm(emptyForm());
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, editingId ? "Failed to update task." : "Failed to create task."), "Projects");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ids: string[]) => {
    try {
      for (const id of ids) {
        await projectsApi.tasks.delete(id);
      }
      notifySuccess(ids.length > 1 ? "Tasks deleted." : "Task deleted.", "Projects");
      setDeleteId(null);
      setConfirmDeleteIds([]);
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete task."), "Projects");
    }
  };

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.taskCode.toLowerCase().includes(q) ||
        projectName(r.projectId).toLowerCase().includes(q);
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
    if (s === "done") return "positive" as const;
    if (s === "inprogress") return "warning" as const;
    if (s === "cancelled") return "danger" as const;
    return "neutral" as const;
  };

  const pendingDeleteIds = deleteId ? [deleteId] : confirmDeleteIds;

  const list = useErpListView({
    listKey: "project-tasks",
    rows: listRows,
    columns: [
      { key: "taskCode", label: "Code" },
      { key: "title", label: "Title" },
      { key: "projectName", label: "Project" },
      { key: "assignedToName", label: "Assignee" },
      { key: "dueDate", label: "Due", dataType: "date" },
      { key: "estimatedHours", label: "Est." },
      { key: "status", label: "Status" },
      { key: "actions", label: "Actions", className: "text-right", locked: true },
    ],
    getRowId: (row) => row.id,
    loading,
    emptyMessage: "Create a task against a project to start timesheet capture.",
    onCreate: () => openCreate(),
    createLabel: "New task",
    onRefresh: () => void load(),
    onBulkDelete: (selected) => {
      if (selected.length === 1 && selected[0]) setDeleteId(selected[0].id);
      else if (selected.length > 1) setConfirmDeleteIds(selected.map((row) => row.id));
    },
    extraFilters: (
      <>
        <ListSearchInput value={search} onChange={setSearch} placeholder="Search tasks…" />
        <ListStatusFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: "All statuses", value: "all" },
            { label: "Open", value: "open" },
            { label: "In Progress", value: "inprogress" },
            { label: "Review", value: "review" },
            { label: "Done", value: "done" },
          ]}
        />
      </>
    ),
    renderRow: (row) => (
      <tr key={row.id} className="erp-tr hover:bg-[var(--bg-muted)]/60">
        <td className="erp-td font-mono text-xs">{row.taskCode}</td>
        <td className="erp-td text-xs font-semibold">{row.title}</td>
        <td className="erp-td text-xs text-slate-600 dark:text-slate-400">{row.projectName}</td>
        <td className="erp-td text-xs">{row.assignedToName ?? "—"}</td>
        <td className="erp-td text-xs">{row.dueDate ?? "—"}</td>
        <td className="erp-td text-xs">{row.estimatedHours != null ? `${row.estimatedHours}h` : "—"}</td>
        <td className="erp-td">
          <StatusBadge tone={tone(row.status)}>{row.status}</StatusBadge>
        </td>
        <td className="erp-td text-right">
          <ErpRowActions
            onEdit={{ label: "Edit", onClick: () => openEdit(row) }}
            onDelete={{ label: "Delete", onClick: () => setDeleteId(row.id) }}
          />
        </td>
      </tr>
    ),
  });

  return (
    <StandardPageLayout
      title="Project Tasks & Kanban Board"
      subtitle="Track delivery items, assignees, and sprint progress across active projects."
      eyebrow="Projects & Operations"
      icon="clipboard"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Total Tasks", value: rows.length },
            { label: "Open", value: rows.filter((r) => r.status === "Open").length, tone: "warning" },
            { label: "In Progress", value: rows.filter((r) => r.status === "InProgress").length, tone: "info" },
            { label: "Done", value: rows.filter((r) => r.status === "Done").length, tone: "positive" },
          ]}
        />
      }
      actions={
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                viewMode === "kanban" ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                viewMode === "table" ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Table
            </button>
          </div>

          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          <ErpCreateButton label="New task" onClick={() => openCreate()} />
        </div>
      }
      filters={viewMode === "table" ? list.filterBar : undefined}
    >
      {viewMode === "table" ? (
        <CrudCard>{list.table}</CrudCard>
      ) : (
        <div className="space-y-4">
          {/* Kanban Search & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-1 items-center gap-3 max-w-md">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter tasks by title, code, or project…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Showing {filtered.length} tasks</span>
            </div>
          </div>

          {/* Kanban Columns Grid */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {KANBAN_COLUMNS.map((col) => {
              const colTasks = filtered.filter(
                (t) =>
                  t.status.toLowerCase() === col.key.toLowerCase() ||
                  (col.key === "Open" && t.status === "Pending"),
              );

              return (
                <div
                  key={col.key}
                  className="flex flex-col rounded-2xl border border-slate-200/90 bg-slate-50/60 p-3.5 min-h-[500px] dark:border-slate-800 dark:bg-slate-900/40"
                >
                  {/* Column Header */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider dark:text-slate-200">{col.label}</h3>
                      <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {colTasks.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openCreate(col.key)}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 cursor-pointer"
                      title={`Add task to ${col.label}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Task Cards Container */}
                  <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
                    {loading ? (
                      <div className="py-8 text-center text-xs text-slate-400">Loading cards…</div>
                    ) : colTasks.length === 0 ? (
                      <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-slate-700">
                        <FolderKanban className="mb-1 h-5 w-5 text-slate-300 dark:text-slate-600" />
                        No tasks in this lane
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <div
                          key={task.id}
                          className="group relative rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded dark:bg-blue-950 dark:text-blue-300">
                              {task.taskCode || "TASK"}
                            </span>

                            <div className="flex items-center gap-1">
                              <select
                                value={task.status}
                                onChange={(e) => void handleQuickStatusChange(task.id, e.target.value)}
                                className="h-6 rounded-md border border-slate-200 bg-slate-50 px-1.5 text-[10px] font-medium text-slate-700 outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              >
                                {KANBAN_COLUMNS.map((c) => (
                                  <option key={c.key} value={c.key}>
                                    {c.key}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => openEdit(task)}
                                className="rounded p-1 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <h4
                            onClick={() => openEdit(task)}
                            className="mt-2 text-xs font-bold text-slate-900 line-clamp-2 cursor-pointer hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                          >
                            {task.title}
                          </h4>

                          {task.description ? (
                            <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 dark:text-slate-400">{task.description}</p>
                          ) : null}

                          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                            <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {(task.assignedToName || "U").slice(0, 1).toUpperCase()}
                              </span>
                              <span className="truncate">{task.assignedToName || "Unassigned"}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {task.estimatedHours != null ? (
                                <span className="flex items-center gap-0.5 text-slate-500 font-mono text-[10px] dark:text-slate-400">
                                  <Clock className="h-3 w-3" />
                                  {task.estimatedHours}h
                                </span>
                              ) : null}

                              {task.dueDate ? (
                                <span className="flex items-center gap-0.5 text-slate-500 text-[10px] dark:text-slate-400">
                                  <Calendar className="h-3 w-3" />
                                  {task.dueDate}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit / Create Task Drawer */}
      <SideDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingId(null);
        }}
        title={editingId ? "Edit project task" : "Create project task"}
        subtitle="Persists to /api/v1/project-tasks"
        footer={
          <ErpDrawerFooter
            onCancel={() => {
              setDrawerOpen(false);
              setEditingId(null);
            }}
            onSave={() => void handleSave()}
            saving={saving}
            isEdit={Boolean(editingId)}
            saveLabel={editingId ? "Save changes" : "Create Task"}
          />
        }
      >
        <div className="space-y-4">
          <div>
            <label className={erpFormLabelClassName}>Project *</label>
            <select
              className={`${erpFormInputClassName} mt-1`}
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
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
            <label className={erpFormLabelClassName}>Title *</label>
            <input
              className={`${erpFormInputClassName} mt-1`}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Implement payment gateway webhook"
            />
          </div>
          <div>
            <label className={erpFormLabelClassName}>Description</label>
            <textarea
              className={`${erpFormInputClassName} mt-1`}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Technical specs, acceptance criteria, or context"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={erpFormLabelClassName}>Status</label>
              <select
                className={`${erpFormInputClassName} mt-1`}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {["Open", "InProgress", "Review", "Done", "Cancelled"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={erpFormLabelClassName}>Assignee Name</label>
              <input
                className={`${erpFormInputClassName} mt-1`}
                value={form.assignedToName}
                onChange={(e) => setForm({ ...form, assignedToName: e.target.value })}
                placeholder="Assignee name"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={erpFormLabelClassName}>Est. Hours</label>
              <input
                type="number"
                min={0}
                className={`${erpFormInputClassName} mt-1`}
                value={form.estimatedHours}
                onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
              />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Due Date</label>
              <input
                type="date"
                className={`${erpFormInputClassName} mt-1`}
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>
        </div>
      </SideDrawer>

      <UniversalDeleteDialog
        open={pendingDeleteIds.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteId(null);
            setConfirmDeleteIds([]);
          }
        }}
        title={pendingDeleteIds.length > 1 ? `Delete ${pendingDeleteIds.length} tasks` : "Delete task"}
        entityName={pendingDeleteIds.length > 1 ? `${pendingDeleteIds.length} tasks` : "this task"}
        onConfirm={async () => handleDelete(pendingDeleteIds)}
      />
    </StandardPageLayout>
  );
}

export default ProjectTasksManager;
