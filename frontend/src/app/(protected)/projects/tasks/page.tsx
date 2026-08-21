"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import { StatusBadge } from "@/components/erp/status-badge";
import { EmptyState } from "@/components/erp/empty-state";
import { SideDrawer } from "@/components/ui/side-drawer";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpFormLabelClassName,
} from "@/components/erp/erpStyles";
import { ListCreateButton, ListSearchInput, ListStatusFilter, ListToolbar } from "@/components/erp/list-toolbar";
import { orgApi, projectsApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";

type TaskRow = {
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

type ProjectOption = { id: string; name: string };

const emptyForm = () => ({
  projectId: "",
  title: "",
  description: "",
  status: "Open",
  estimatedHours: "8",
  dueDate: "",
  assignedToName: "",
});

export default function ProjectTasksPage() {
  const [rows, setRows] = useState<TaskRow[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? id.slice(0, 8);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
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

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await projectsApi.tasks.delete(id);
      notifySuccess("Task deleted.", "Projects");
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete task."), "Projects");
    }
  };

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      r.title.toLowerCase().includes(q) ||
      r.taskCode.toLowerCase().includes(q) ||
      projectName(r.projectId).toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || r.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const tone = (status: string) => {
    const s = status.toLowerCase();
    if (s === "done") return "positive" as const;
    if (s === "inprogress") return "warning" as const;
    if (s === "cancelled") return "danger" as const;
    return "neutral" as const;
  };

  return (
    <StandardPageLayout
      title="Project Tasks"
      subtitle="Track delivery work items against active projects and cost centres."
      eyebrow="Projects"
      icon="clipboard"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Tasks", value: rows.length },
            { label: "Open", value: rows.filter((r) => r.status === "Open").length, tone: "warning" },
            { label: "Done", value: rows.filter((r) => r.status === "Done").length, tone: "positive" },
          ]}
        />
      }
      actions={<ListCreateButton label="New task" onClick={openCreate} />}
      filters={
        <ListToolbar
          search={<ListSearchInput value={search} onChange={setSearch} placeholder="Search tasks…" />}
          filters={
            <ListStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "All statuses", value: "all" },
                { label: "Open", value: "open" },
                { label: "In Progress", value: "inprogress" },
                { label: "Done", value: "done" },
                { label: "Cancelled", value: "cancelled" },
              ]}
            />
          }
        />
      }
    >
      <CrudCard title="Task register" description="Linked to /api/v1/project-tasks for the current tenant.">
        {loading ? (
          <div className="erp-loading">Loading tasks…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No project tasks"
            description="Create a task against a project to start timesheet capture."
            ctaLabel="New task"
            onClick={openCreate}
          />
        ) : (
          <div className="erp-table-wrap rounded-none border-0 shadow-none">
            <table className="erp-table">
              <thead className="erp-thead">
                <tr>
                  <th className="erp-th">Code</th>
                  <th className="erp-th">Title</th>
                  <th className="erp-th">Project</th>
                  <th className="erp-th">Assignee</th>
                  <th className="erp-th">Due</th>
                  <th className="erp-th">Est.</th>
                  <th className="erp-th">Status</th>
                  <th className="erp-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="erp-tr hover:bg-[var(--bg-muted)]/60">
                    <td className="erp-td font-mono text-xs">{row.taskCode}</td>
                    <td className="erp-td text-xs font-semibold">{row.title}</td>
                    <td className="erp-td text-xs text-slate-600">{projectName(row.projectId)}</td>
                    <td className="erp-td text-xs">{row.assignedToName ?? "—"}</td>
                    <td className="erp-td text-xs">{row.dueDate ?? "—"}</td>
                    <td className="erp-td text-xs">{row.estimatedHours != null ? `${row.estimatedHours}h` : "—"}</td>
                    <td className="erp-td">
                      <StatusBadge tone={tone(row.status)}>{row.status}</StatusBadge>
                    </td>
                    <td className="erp-td text-right">
                      <div className="inline-flex gap-1">
                        <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2`} onClick={() => openEdit(row)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className={`${erpButtonClassName.ghost} h-8 px-2 text-rose-600`}
                          onClick={() => void handleDelete(row.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CrudCard>

      <SideDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingId(null);
        }}
        title={editingId ? "Edit project task" : "Create project task"}
        subtitle="Persists to /api/v1/project-tasks"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={erpButtonClassName.secondary}
              onClick={() => {
                setDrawerOpen(false);
                setEditingId(null);
              }}
            >
              Cancel
            </button>
            <button type="button" className={erpButtonClassName.primary} disabled={saving} onClick={() => void handleSave()}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Create"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={erpFormLabelClassName}>Project</label>
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
            <label className={erpFormLabelClassName}>Title</label>
            <input
              className={`${erpFormInputClassName} mt-1`}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className={erpFormLabelClassName}>Description</label>
            <textarea
              className={`${erpFormInputClassName} mt-1`}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                {["Open", "InProgress", "Done", "Cancelled"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={erpFormLabelClassName}>Assignee name</label>
              <input
                className={`${erpFormInputClassName} mt-1`}
                value={form.assignedToName}
                onChange={(e) => setForm({ ...form, assignedToName: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={erpFormLabelClassName}>Est. hours</label>
              <input
                type="number"
                min={0}
                className={`${erpFormInputClassName} mt-1`}
                value={form.estimatedHours}
                onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
              />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Due date</label>
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
    </StandardPageLayout>
  );
}
