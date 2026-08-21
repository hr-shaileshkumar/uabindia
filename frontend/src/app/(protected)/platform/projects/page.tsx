"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, Plus, Eye, CheckCircle2, DollarSign, FolderGit2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { useOrgContext } from "@/context/OrgContext";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  mapProjectToRow,
  usePlatformProjects,
  useProjectMutations,
} from "@/features/platform/hooks/usePlatformProjects";
import DynamicFieldsSection from "@/components/DynamicFieldsSection";
import { orgApi } from "@/services/modules/org";
import type { Project } from "@/types";
import { erpButtonClassName } from "@/components/erp/erpStyles";

type ProjectRow = ReturnType<typeof mapProjectToRow>;

type ProjectFormState = {
  projectCode: string;
  name: string;
  clientName: string;
  description: string;
  projectType: string;
  priority: string;
  status: string;
  budget: string;
  completionPercentage: string;
  startDate: string;
  endDate: string;
  location: string;
  contractNumber: string;
  billingType: string;
  currencyCode: string;
};

const emptyForm = (): ProjectFormState => ({
  projectCode: "",
  name: "",
  clientName: "",
  description: "",
  projectType: "Internal",
  priority: "Medium",
  status: "Planned",
  budget: "500000",
  completionPercentage: "0",
  startDate: "",
  endDate: "",
  location: "",
  contractNumber: "",
  billingType: "",
  currencyCode: "INR",
});

const fromProject = (p: Project): ProjectFormState => ({
  projectCode: p.projectCode ?? "",
  name: p.name ?? "",
  clientName: p.clientName ?? "",
  description: p.description ?? "",
  projectType: p.projectType || "Internal",
  priority: p.priority || "Medium",
  status: p.status || "Planned",
  budget: String(p.budget ?? 0),
  completionPercentage: String(p.completionPercentage ?? 0),
  startDate: p.startDate ? String(p.startDate).slice(0, 10) : "",
  endDate: p.endDate ? String(p.endDate).slice(0, 10) : "",
  location: p.location ?? "",
  contractNumber: p.contractNumber ?? "",
  billingType: p.billingType ?? "",
  currencyCode: p.currencyCode || "INR",
});

export default function ProjectsPage() {
  const { companyId } = useOrgContext();
  const { data = [], isLoading, isError, error, refetch } = usePlatformProjects(companyId, undefined);
  const { createProject, updateProject, deleteProject } = useProjectMutations();

  const projects = useMemo(() => data.map(mapProjectToRow), [data]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mode, setMode] = useState<"closed" | "create" | "view" | "edit">("closed");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Project | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState<ProjectFormState>(emptyForm);

  const selectedRow = projects.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId || (mode !== "view" && mode !== "edit")) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    void orgApi.project
      .getById(selectedId)
      .then((res) => {
        if (cancelled) return;
        const payload = res.data as { project?: Project };
        const project = payload.project ?? (res.data as Project);
        setDetail(project);
        setForm(fromProject(project));
      })
      .catch((err) => {
        if (!cancelled) notifyError(getApiErrorMessage(err, "Failed to load project details."));
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, mode]);

  const openCreate = () => {
    setSelectedId(null);
    setDetail(null);
    setForm(emptyForm());
    setMode("create");
  };

  const openView = (row: ProjectRow) => {
    setSelectedId(row.id);
    setMode("view");
  };

  const closeInspector = () => {
    setMode("closed");
    setSelectedId(null);
    setDetail(null);
    setForm(emptyForm());
  };

  const setField = <K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (!companyId) {
      notifyError("Select a company in workspace context before creating a project.");
      return;
    }
    try {
      await createProject.mutateAsync({
        name: form.name.trim(),
        companyId,
        projectCode: form.projectCode.trim() || undefined,
        clientName: form.clientName.trim() || undefined,
        description: form.description.trim() || undefined,
        projectType: form.projectType,
        priority: form.priority,
        status: form.status,
        budget: Number(form.budget) || undefined,
        currencyCode: form.currencyCode || "INR",
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        location: form.location.trim() || undefined,
        contractNumber: form.contractNumber.trim() || undefined,
        billingType: form.billingType.trim() || undefined,
      });
      notifySuccess(`Project "${form.name.trim()}" created.`);
      closeInspector();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create project."));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !form.name.trim()) return;
    try {
      await updateProject.mutateAsync({
        id: selectedId,
        payload: {
          name: form.name.trim(),
          projectCode: form.projectCode.trim() || undefined,
          clientName: form.clientName.trim() || undefined,
          description: form.description.trim() || undefined,
          projectType: form.projectType,
          priority: form.priority,
          status: form.status,
          budget: Number(form.budget) || undefined,
          currencyCode: form.currencyCode || "INR",
          completionPercentage: Number(form.completionPercentage) || 0,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          location: form.location.trim() || undefined,
          contractNumber: form.contractNumber.trim() || undefined,
          billingType: form.billingType.trim() || undefined,
        },
      });
      notifySuccess("Project updated.");
      setMode("view");
      void refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to update project."));
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!window.confirm("Soft-delete this project? You can restore later from admin tools.")) return;
    try {
      await deleteProject.mutateAsync(selectedId);
      notifySuccess("Project deleted.");
      closeInspector();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete project."));
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || p.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const kpis: KpiMetricItem[] = [
    { label: "Active Projects", value: projects.length, tone: "info", icon: <FolderGit2 className="h-3.5 w-3.5" />, subtext: "Live API" },
    { label: "In Progress", value: projects.filter((p) => p.status === "In Progress").length, tone: "positive", icon: <Activity className="h-3.5 w-3.5" />, subtext: "Active" },
    { label: "Completed", value: projects.filter((p) => p.status === "Completed").length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Delivered" },
    {
      label: "Total Budget",
      value: `₹${(projects.reduce((acc, p) => acc + (p.budget || 0), 0) / 100000).toFixed(1)}L`,
      tone: "warning",
      icon: <DollarSign className="h-3.5 w-3.5" />,
      subtext: "Allocated",
    },
  ];

  const formFields = (
    <>
      {!companyId && mode === "create" && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">
          Select a company in workspace context (/context) before creating a project.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Project Code</Label>
          <Input value={form.projectCode} onChange={(e) => setField("projectCode", e.target.value)} disabled={mode === "view"} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Status</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={form.status}
            onChange={(e) => setField("status", e.target.value)}
            disabled={mode === "view"}
          >
            {["Planned", "In Progress", "On Hold", "Completed", "Cancelled"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Project Name *</Label>
        <Input value={form.name} onChange={(e) => setField("name", e.target.value)} required disabled={mode === "view"} />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Description</Label>
        <textarea
          className="flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          disabled={mode === "view"}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Client</Label>
          <Input value={form.clientName} onChange={(e) => setField("clientName", e.target.value)} disabled={mode === "view"} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Location</Label>
          <Input value={form.location} onChange={(e) => setField("location", e.target.value)} disabled={mode === "view"} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Type</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={form.projectType}
            onChange={(e) => setField("projectType", e.target.value)}
            disabled={mode === "view"}
          >
            {["Internal", "External", "Billable", "Non-Billable"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Priority</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={form.priority}
            onChange={(e) => setField("priority", e.target.value)}
            disabled={mode === "view"}
          >
            {["Low", "Medium", "High", "Critical"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Budget (₹)</Label>
          <Input type="number" value={form.budget} onChange={(e) => setField("budget", e.target.value)} disabled={mode === "view"} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Completion %</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={form.completionPercentage}
            onChange={(e) => setField("completionPercentage", e.target.value)}
            disabled={mode === "view"}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Start date</Label>
          <Input type="date" value={form.startDate} onChange={(e) => setField("startDate", e.target.value)} disabled={mode === "view"} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">End date</Label>
          <Input type="date" value={form.endDate} onChange={(e) => setField("endDate", e.target.value)} disabled={mode === "view"} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Contract #</Label>
          <Input value={form.contractNumber} onChange={(e) => setField("contractNumber", e.target.value)} disabled={mode === "view"} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Billing type</Label>
          <Input value={form.billingType} onChange={(e) => setField("billingType", e.target.value)} disabled={mode === "view"} placeholder="Fixed / T&M" />
        </div>
      </div>
      {detail?.companyName || detail?.actualCost != null ? (
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-3 space-y-1 text-xs">
          {detail.companyName ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Company</span>
              <span className="font-semibold">{detail.companyName}</span>
            </div>
          ) : null}
          {detail.actualCost != null ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Actual cost</span>
              <span className="font-mono">₹{Number(detail.actualCost).toLocaleString()}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );

  return (
    <PlatformGlobalPageShell
      title="Project Workspaces & Project Governance"
      subtitle="Track project codes, client deliverables, budget allocations, and completion milestones across tenants."
      categoryTag="Project Portfolio Governance"
      kpiMetrics={kpis}
      searchPlaceholder="Filter by project name, code, or client..."
      searchValue={search}
      onSearchChange={setSearch}
      filterOptions={[
        {
          key: "status",
          label: "All Statuses",
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { label: "All Statuses", value: "all" },
            { label: "Planned", value: "planning" },
            { label: "In Progress", value: "in progress" },
            { label: "On Hold", value: "on hold" },
            { label: "Completed", value: "completed" },
          ],
        },
      ]}
      onClearFilters={() => {
        setSearch("");
        setStatusFilter("all");
      }}
      primaryActionLabel="New Project"
      onPrimaryAction={openCreate}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
      onRefresh={() => void refetch()}
      isLoading={isLoading}
      isInspectorOpen={mode !== "closed"}
      onInspectorClose={closeInspector}
      inspectorTitle={
        mode === "create"
          ? "Create Project Workspace"
          : mode === "edit"
            ? `Edit: ${selectedRow?.name ?? "Project"}`
            : `Project Details: ${selectedRow?.name ?? ""}`
      }
      inspectorSubTitle={
        mode === "create"
          ? "Define client, budget, dates, and commercial scope."
          : selectedRow
            ? `Code ${selectedRow.code}`
            : undefined
      }
      inspectorContent={
        <div className="space-y-4 text-xs">
          {detailLoading && (mode === "view" || mode === "edit") ? (
            <p className="text-muted-foreground">Loading details…</p>
          ) : null}

          {mode === "create" ? (
            <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
              {formFields}
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" size="sm" onClick={closeInspector}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createProject.isPending || !companyId}>
                  {createProject.isPending ? "Creating…" : "Create Project"}
                </Button>
              </div>
            </form>
          ) : null}

          {(mode === "view" || mode === "edit") && selectedId ? (
            <>
              {mode === "edit" ? (
                <form onSubmit={(e) => void handleUpdate(e)} className="space-y-4">
                  {formFields}
                  <div className="flex flex-wrap justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" size="sm" onClick={() => setMode("view")}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={updateProject.isPending}>
                      {updateProject.isPending ? "Saving…" : "Save changes"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {formFields}
                  <DynamicFieldsSection entityName="Project" recordId={selectedId} editable compact />
                  <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <Link href="/projects/tasks" className={`${erpButtonClassName.secondary} h-8 px-3 text-xs inline-flex items-center`}>
                      Tasks
                    </Link>
                    <Link href="/projects/timesheets" className={`${erpButtonClassName.secondary} h-8 px-3 text-xs inline-flex items-center`}>
                      Timesheets
                    </Link>
                    <div className="ml-auto flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setMode("edit")}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1 text-rose-600"
                        disabled={deleteProject.isPending}
                        onClick={() => void handleDelete()}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      }
    >
      {isError && (
        <p className="px-4 py-3 text-xs text-rose-600 border-b border-[var(--border-subtle)]">
          {getApiErrorMessage(error, "Failed to load projects.")}
        </p>
      )}
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Project Code</th>
              <th className="erp-th">Project Title</th>
              <th className="erp-th">Client</th>
              <th className="erp-th">Budget</th>
              <th className="erp-th">Completion %</th>
              <th className="erp-th">Status</th>
              <th className="erp-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="erp-td text-center text-xs text-muted-foreground py-8">
                  Loading projects…
                </td>
              </tr>
            ) : filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={7} className="erp-td text-center text-xs text-muted-foreground py-8">
                  No projects found. Use New Project to create one.
                </td>
              </tr>
            ) : (
              filteredProjects.map((prj) => (
                <tr key={prj.id} className="erp-tr hover:bg-[var(--bg-muted)]/60 transition-colors">
                  <td className="erp-td font-mono font-bold text-xs text-slate-800 dark:text-slate-200">{prj.code}</td>
                  <td className="erp-td">
                    <button type="button" className="font-semibold text-xs flex items-center gap-1.5 text-left hover:underline" onClick={() => openView(prj)}>
                      <FolderGit2 className="h-4 w-4 text-slate-600" />
                      {prj.name}
                    </button>
                  </td>
                  <td className="erp-td text-xs text-muted-foreground">{prj.client}</td>
                  <td className="erp-td font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    ₹{(prj.budget || 0).toLocaleString()}
                  </td>
                  <td className="erp-td">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-slate-900 h-full rounded-full" style={{ width: `${prj.completion}%` }} />
                      </div>
                      <span className="font-mono text-[11px]">{prj.completion}%</span>
                    </div>
                  </td>
                  <td className="erp-td">
                    <span
                      className={
                        prj.status === "Completed"
                          ? "erp-chip erp-chip-success"
                          : prj.status === "In Progress"
                            ? "erp-chip erp-chip-info"
                            : "erp-chip erp-chip-warning"
                      }
                    >
                      {prj.status}
                    </span>
                  </td>
                  <td className="erp-td text-right">
                    <div className="inline-flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View / Edit" onClick={() => openView(prj)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Edit"
                        onClick={() => {
                          setSelectedId(prj.id);
                          setMode("edit");
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
