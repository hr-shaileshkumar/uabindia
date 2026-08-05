"use client";

import { useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { PageHeader } from "@/design-system";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";

import { useAuth } from "@/context/AuthContext";
import { hrApi } from "@/services/hrApi";
import { useOrgContext } from "@/context/OrgContext";
import { getApiErrorMessage } from "@/lib/api-errors";
import { isSuperAdminRole } from "@/lib/auth/role-utils";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionBar } from "@/components/table/BulkActionBar";
import { BulkEditDialog } from "@/components/table/BulkEditDialog";
import { SelectionCheckbox } from "@/components/table/SelectionCheckbox";
import { SelectAllCheckbox } from "@/components/table/SelectAllCheckbox";
import { TableActionMenu } from "@/components/table/TableActionMenu";
import QuickEditDrawer from "@/components/ui/QuickEditDrawer";
import EntityProfileCard from "@/components/ui/EntityProfileCard";
import { EmptyState } from "@/components/erp/empty-state";

import type { BulkActionFieldConfig } from "@/features/shared/types/bulkActions";
import type { Project } from "@/types";

type TabKey = "list" | "general" | "financials" | "client";

type ProjectDraft = Partial<Project>;

type QuickProjectEditState = {
  name: string;
  projectCode: string;
  completionPercentage: number;
  status: string;
  isActive: boolean;
};

const formLabelClassName = "erp-label";
const formInputClassName = "erp-input";
const formSelectClassName = "erp-select";
const formPanelClassName = "erp-content-surface space-y-4";
const formGridTwoClassName = "grid grid-cols-1 gap-4 md:grid-cols-2";

const createEmptyProjectForm = (): ProjectDraft => ({
  isActive: true,
  status: "Planning",
  priority: "Medium",
  completionPercentage: 0,
  currencyCode: "INR",
  billingType: "Fixed Bid",
});

const csvEscape = (value: string | number | undefined) => {
  const stringValue = String(value ?? "");
  return `"${stringValue.replace(/"/g, '""')}"`;
};

export default function ProjectsPage() {
  const { confirm, confirmDialog } = useConfirmDialog();
  const { user } = useAuth();
  const { companyId: ctxCompanyId } = useOrgContext();
  
  const roles = (user as { roles?: string[] } | null)?.roles || [];
  const isSuperAdmin = roles.some((role) => isSuperAdminRole(role));

  const [activeTab, setActiveTab] = useState<TabKey>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [formData, setFormData] = useState<ProjectDraft>(createEmptyProjectForm);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Quick edit drawer state
  const [quickEditProject, setQuickEditProject] = useState<Project | null>(null);
  const [quickEditSaving, setQuickEditSaving] = useState(false);
  const [quickEditForm, setQuickEditForm] = useState<QuickProjectEditState>({
    name: "",
    projectCode: "",
    completionPercentage: 0,
    status: "Planning",
    isActive: true,
  });

  // Bulk actions selection
  const selection = useTableSelection<Project>();
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkApplying, setBulkApplying] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");

  const projectBulkFields: BulkActionFieldConfig[] = [
    { key: "isActive", label: "Active Status", fieldType: "boolean" },
    {
      key: "status",
      label: "Status",
      fieldType: "select",
      options: [
        { value: "Planning", label: "Planning" },
        { value: "In Progress", label: "In Progress" },
        { value: "On Hold", label: "On Hold" },
        { value: "Completed", label: "Completed" },
        { value: "Cancelled", label: "Cancelled" },
      ],
    },
    {
      key: "priority",
      label: "Priority",
      fieldType: "select",
      options: [
        { value: "Low", label: "Low" },
        { value: "Medium", label: "Medium" },
        { value: "High", label: "High" },
        { value: "Critical", label: "Critical" },
      ],
    },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      setActionError(null);

      // Load companies registry for selection dropdowns
      const companiesRes = await hrApi.company.getAllForSuperAdmin();
      const rawCompanies = Array.isArray(companiesRes.data?.companies) ? companiesRes.data.companies : [];
      setCompanies(rawCompanies.map((c) => ({ id: c.id, name: c.name })));

      // Load projects from backend
      const res = await hrApi.project.getAll(undefined, undefined, showDeleted);
      const rawProjects = Array.isArray(res.data?.projects) ? res.data.projects : [];
      
      // Enrich project entity models with company names
      const enriched = rawProjects.map((p) => {
        const found = rawCompanies.find((c) => c.id === p.companyId);
        return {
          ...p,
          companyName: found ? found.name : "System Shared",
        };
      });
      setProjects(enriched);
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Failed to load project registry."));
      notifyError("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDeleted]);

  useEffect(() => {
    selection.setItems(projects);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Visibility soft delete check
      if (showDeleted ? !project.isDeleted : project.isDeleted) return false;
      
      // Org context constraints
      if (ctxCompanyId && project.companyId !== ctxCompanyId) return false;

      // Filter selections
      if (companyFilter !== "all" && project.companyId !== companyFilter) return false;
      if (statusFilter !== "all" && project.status !== statusFilter) return false;

      // Query string matching
      const query = search.trim().toLowerCase();
      if (!query) return true;

      return (
        project.name.toLowerCase().includes(query) ||
        project.projectCode.toLowerCase().includes(query) ||
        (project.clientName || "").toLowerCase().includes(query) ||
        (project.projectType || "").toLowerCase().includes(query)
      );
    });
  }, [projects, showDeleted, ctxCompanyId, companyFilter, statusFilter, search]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = event.target;
    const fieldName = target.name as keyof ProjectDraft;
    const nextValue = target instanceof HTMLInputElement && target.type === "checkbox"
      ? target.checked
      : target.value;

    setFormData((previous) => ({
      ...previous,
      [fieldName]: nextValue,
    }));
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      setActionError("Project name is required.");
      return;
    }
    if (!formData.projectCode?.trim()) {
      setActionError("Project Code is required.");
      return;
    }
    const targetCompanyId = editingId ? formData.companyId : selectedCompanyId;
    if (!targetCompanyId) {
      setActionError("Please select a target Company registry.");
      return;
    }

    const ok = await confirm({
      title: editingId ? "Update Project Details" : "Register New Project",
      message: editingId
        ? `Confirm updating project details for "${formData.name.trim()}"?`
        : `Confirm onboarding project "${formData.name.trim()}" under the selected company?`,
      confirmText: editingId ? "Update" : "Register",
    });
    if (!ok) return;

    try {
      setSaving(true);
      setActionError(null);

      const payload = {
        name: formData.name.trim(),
        projectCode: formData.projectCode.trim(),
        companyId: targetCompanyId,
        description: formData.description?.trim() || undefined,
        projectType: formData.projectType || "Customer Project",
        priority: formData.priority || "Medium",
        status: formData.status || "Planning",
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        actualStartDate: formData.actualStartDate || undefined,
        actualEndDate: formData.actualEndDate || undefined,
        budget: formData.budget ? Number(formData.budget) : undefined,
        actualCost: formData.actualCost ? Number(formData.actualCost) : undefined,
        currencyCode: formData.currencyCode || "INR",
        clientName: formData.clientName?.trim() || undefined,
        contractNumber: formData.contractNumber?.trim() || undefined,
        billingType: formData.billingType || "Fixed Bid",
        completionPercentage: formData.completionPercentage ? Number(formData.completionPercentage) : 0,
        projectManagerId: formData.projectManagerId || undefined,
        location: formData.location?.trim() || undefined,
      };

      if (editingId) {
        await hrApi.project.update(editingId, payload);
        notifySuccess("Project updated successfully.");
      } else {
        await hrApi.project.create(payload);
        notifySuccess("Project registered successfully.");
      }

      setFormData(createEmptyProjectForm());
      setSelectedCompanyId("");
      setEditingId(null);
      setActiveTab("list");
      void loadData();
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to save project.");
      setActionError(message);
      notifyError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (project: Project) => {
    setActionError(null);
    setFormData({
      ...project,
      startDate: project.startDate ? project.startDate.split("T")[0] : "",
      endDate: project.endDate ? project.endDate.split("T")[0] : "",
      actualStartDate: project.actualStartDate ? project.actualStartDate.split("T")[0] : "",
      actualEndDate: project.actualEndDate ? project.actualEndDate.split("T")[0] : "",
    });
    setEditingId(project.id);
    setSelectedCompanyId(project.companyId);
    setActiveTab("general");
  };

  const openQuickEdit = (project: Project) => {
    setQuickEditProject(project);
    setQuickEditForm({
      name: project.name || "",
      projectCode: project.projectCode || "",
      completionPercentage: project.completionPercentage || 0,
      status: project.status || "Planning",
      isActive: project.isActive,
    });
  };

  const handleQuickEditSave = async () => {
    if (!quickEditProject) return;
    if (!quickEditForm.name.trim() || !quickEditForm.projectCode.trim()) {
      notifyError("Name and Project Code are required.");
      return;
    }

    try {
      setQuickEditSaving(true);
      await hrApi.project.update(quickEditProject.id, {
        name: quickEditForm.name.trim(),
        projectCode: quickEditForm.projectCode.trim(),
        completionPercentage: Number(quickEditForm.completionPercentage),
        status: quickEditForm.status,
      });
      notifySuccess("Project quick-updated successfully.");
      setQuickEditProject(null);
      void loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to quick update project."));
    } finally {
      setQuickEditSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Archive Project Record",
      message: "Archive this project? It will be soft-deleted and can be recovered from deleted items.",
      confirmText: "Archive Project",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await hrApi.project.delete(id);
      notifySuccess("Project archived successfully.");
      void loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to archive project."));
    }
  };

  const handleRestore = async (project: Project) => {
    try {
      await hrApi.project.restore(project.id);
      notifySuccess("Project restored successfully.");
      void loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to restore project."));
    }
  };

  const handleHardDelete = async (project: Project) => {
    const ok = await confirm({
      title: "Permanent Delete Project",
      message: `Permanently delete project "${project.name}"? This cannot be undone.`,
      confirmText: "Permanent Delete",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await hrApi.platform.recycleBin.hardDelete("Projects", project.id);
      notifySuccess("Project record permanently purged.");
      void loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to permanently purge project."));
    }
  };

  const handleBulkDelete = async () => {
    const count = selection.selectionCount;
    const ok = await confirm({
      title: "Archive Selected Projects",
      message: `Archive the ${count} selected project record${count === 1 ? "" : "s"}?`,
      confirmText: "Archive All",
      variant: "danger",
    });
    if (!ok) return;

    setBulkApplying(true);
    let successCount = 0;
    for (const project of selection.selectedItems) {
      try {
        await hrApi.project.delete(project.id);
        successCount += 1;
      } catch {
        // continue
      }
    }
    setBulkApplying(false);
    selection.clearSelection();
    notifySuccess(`Archived ${successCount} of ${count} projects.`);
    void loadData();
  };

  const handleBulkEdit = async (updates: Record<string, unknown>) => {
    setBulkApplying(true);
    let successCount = 0;
    const count = selection.selectionCount;
    for (const project of selection.selectedItems) {
      try {
        await hrApi.project.update(project.id, updates);
        successCount += 1;
      } catch {
        // continue
      }
    }
    setBulkApplying(false);
    setBulkEditOpen(false);
    selection.clearSelection();
    notifySuccess(`Updated ${successCount} of ${count} projects.`);
    void loadData();
  };

  const handleNew = () => {
    setActionError(null);
    setFormData(createEmptyProjectForm());
    setSelectedCompanyId(ctxCompanyId || "");
    setEditingId(null);
    setActiveTab("general");
  };

  const handleCancel = () => {
    setActionError(null);
    setFormData(createEmptyProjectForm());
    setEditingId(null);
    setActiveTab("list");
  };

  const exportCsv = () => {
    const headers = [
      "S.No",
      "Project Name",
      "Code",
      "Company",
      "Type",
      "Priority",
      "Status",
      "Client",
      "Budget",
      "Completion %",
    ];
    const rows = filteredProjects.map((p, idx) => [
      idx + 1,
      p.name,
      p.projectCode,
      p.companyName || p.companyId,
      p.projectType,
      p.priority,
      p.status,
      p.clientName || "-",
      p.budget || 0,
      `${p.completionPercentage}%`,
    ]);

    const lines = [
      headers.map(csvEscape).join(","),
      ...rows.map((row) => row.map((val) => csvEscape(val)).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "project-master.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    notifySuccess("Project export generated.");
  };

  return (
    <div className="erp-page space-y-5">
      {confirmDialog}
      
      <PageHeader
        title="Project Registry"
        subtitle="Manage client engagements, project codes, resource billing arrangements, and progress tracking."
        eyebrow="Platform / Governance"
        icon="folder"
        stats={[
          { label: "Projects", value: projects.length },
          { label: "Active", value: projects.filter((p) => p.isActive && !p.isDeleted).length, tone: "success" },
          { label: "In Progress", value: projects.filter((p) => p.status === "In Progress" && !p.isDeleted).length, tone: "info" },
          { label: "Filtered", value: filteredProjects.length, tone: "warning" },
        ]}
        actions={
          activeTab === "list" ? (
            <div className="flex flex-wrap items-center gap-2">
              {isSuperAdmin && (
                <button
                  onClick={() => setShowDeleted((prev) => !prev)}
                  className={`erp-action-btn ${showDeleted ? "erp-action-btn-warning" : "erp-action-btn-secondary"}`}
                >
                  {showDeleted ? "Hide Deleted" : "Show Deleted"}
                </button>
              )}
              <button onClick={handleNew} className="erp-action-btn erp-action-btn-primary">
                Create Project
              </button>
            </div>
          ) : undefined
        }
      />
        {actionError && <div className="erp-alert-error mb-4">{actionError}</div>}

        {activeTab === "list" && selection.selectionCount > 0 && (
          <BulkActionBar
            selectionCount={selection.selectionCount}
            onEdit={() => setBulkEditOpen(true)}
            onRefresh={() => {
              selection.clearSelection();
              void loadData();
            }}
            onDelete={() => void handleBulkDelete()}
            onClear={selection.clearSelection}
            loading={bulkApplying}
          />
        )}

        {bulkEditOpen && (
          <BulkEditDialog
            fields={projectBulkFields}
            selectionCount={selection.selectionCount}
            onApply={handleBulkEdit}
            onClose={() => setBulkEditOpen(false)}
            loading={bulkApplying}
          />
        )}

        <div className="overflow-x-auto">
          <div className="erp-tabs-list min-w-max">
            <button
              onClick={() => setActiveTab("list")}
              className={`erp-tab-trigger whitespace-nowrap ${activeTab === "list" ? "erp-tab-trigger-active" : ""}`}
            >
              Projects ({filteredProjects.length})
            </button>
            {(editingId || activeTab !== "list") && (
              <>
                <button
                  onClick={() => setActiveTab("general")}
                  className={`erp-tab-trigger whitespace-nowrap ${activeTab === "general" ? "erp-tab-trigger-active" : ""}`}
                >
                  General Details
                </button>
                <button
                  onClick={() => setActiveTab("financials")}
                  className={`erp-tab-trigger whitespace-nowrap ${activeTab === "financials" ? "erp-tab-trigger-active" : ""}`}
                >
                  Financials & Billing
                </button>
                <button
                  onClick={() => setActiveTab("client")}
                  className={`erp-tab-trigger whitespace-nowrap ${activeTab === "client" ? "erp-tab-trigger-active" : ""}`}
                >
                  Client & Contract Info
                </button>
              </>
            )}
          </div>
        </div>

        {activeTab === "list" && (
          <div className="erp-panel overflow-hidden">
            <div className="erp-table-toolbar">
              <div>
                <div className="erp-table-title">Project Directory</div>
                <div className="erp-table-subtitle">
                  Track project metadata, completion states, billing settings, and client scopes.
                </div>
              </div>
              <span className="erp-toolbar-badge">
                {loading ? "Refreshing..." : `${filteredProjects.length} projects`}
              </span>
            </div>

            <div className="mb-4 grid gap-3 p-4 xl:grid-cols-[1.6fr_0.9fr_0.9fr_0.8fr]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by project name, code, client, or type..."
                className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-300"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              >
                <option value="all">All statuses</option>
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              >
                <option value="all">All Companies</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                onClick={exportCsv}
                className="rounded-3xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-3 text-sm font-semibold transition"
              >
                Export CSV
              </button>
            </div>

            {loading ? (
              <div className="erp-panel-body py-16 text-center text-slate-500">
                Loading projects...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="erp-panel-body">
                <EmptyState
                  title="No projects found"
                  description="Onboard your first project to associate tasks, billable resources, and corporate operations."
                  ctaLabel="Create Project"
                  ctaHref=""
                  onClick={handleNew}
                />
              </div>
            ) : (
              <div className="erp-table-wrap rounded-none border-0 shadow-none">
                <table className="erp-table">
                  <thead className="erp-thead">
                    <tr>
                      <th className="erp-th">
                        <SelectAllCheckbox
                          checked={selection.isAllSelected}
                          indeterminate={selection.isIndeterminate}
                          onChange={selection.isAllSelected ? selection.clearSelection : selection.selectAll}
                        />
                      </th>
                      <th className="erp-th">Project Code</th>
                      <th className="erp-th">Project Name</th>
                      <th className="erp-th">Company</th>
                      <th className="erp-th">Billing Type</th>
                      <th className="erp-th">Progress</th>
                      <th className="erp-th">Status</th>
                      <th className="erp-th">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr
                        key={project.id}
                        className={`erp-tr ${project.isDeleted ? "opacity-50 bg-red-50" : ""}`}
                      >
                        <td className="erp-td">
                          <SelectionCheckbox
                            checked={selection.isSelected(project.id)}
                            onChange={() => selection.toggleSelection(project.id)}
                            label={`Select ${project.name}`}
                          />
                        </td>
                        <td className="erp-td font-mono font-medium text-slate-700">
                          {project.projectCode}
                        </td>
                        <td className="erp-td">
                          <div className="erp-row-title">{project.name}</div>
                          <div className="erp-row-meta">
                            {project.projectType || "Standard Project"}
                          </div>
                        </td>
                        <td className="erp-td text-slate-600">{project.companyName || "—"}</td>
                        <td className="erp-td text-slate-600">{project.billingType || "—"}</td>
                        <td className="erp-td">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-indigo-650 h-full rounded-full"
                                style={{ width: `${project.completionPercentage || 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 font-medium">
                              {project.completionPercentage || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="erp-td">
                          <span
                            className={`erp-chip ${
                              project.status === "Completed"
                                ? "erp-chip-success"
                                : project.status === "In Progress"
                                  ? "bg-sky-50 text-sky-700 border-sky-100"
                                  : project.status === "Planning"
                                    ? "bg-amber-50 text-amber-700 border-amber-100"
                                    : "erp-chip-neutral"
                            }`}
                          >
                            {project.status}
                          </span>
                        </td>
                        <td className="erp-td">
                          <TableActionMenu
                            items={
                              !project.isDeleted
                                ? [
                                    { label: "View Card Details", onClick: () => setSelectedProject(project) },
                                    { label: "Quick Edit Details", onClick: () => openQuickEdit(project) },
                                    { label: "Full Form Editor", onClick: () => handleEdit(project) },
                                    { label: "Archive Record", onClick: () => void handleDelete(project.id), danger: true },
                                  ]
                                : [
                                    { label: "Restore Record", onClick: () => void handleRestore(project) },
                                    { label: "Permanent Purge", onClick: () => void handleHardDelete(project), danger: true },
                                  ]
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "list" && selectedProject && (
          <div className="mt-4">
            <EntityProfileCard
              title={selectedProject.name}
              subtitle={`${selectedProject.projectCode} — ${selectedProject.projectType}`}
              badge={
                <span className="erp-chip erp-chip-success">
                  {selectedProject.status}
                </span>
              }
              items={[
                { label: "Billing Type", value: selectedProject.billingType || "—" },
                { label: "Client Scope", value: selectedProject.clientName || "—" },
                { label: "Contract Ref", value: selectedProject.contractNumber || "—" },
                { label: "Budget Scope", value: selectedProject.budget ? `${selectedProject.currencyCode} ${selectedProject.budget}` : "—" },
                { label: "Location Setup", value: selectedProject.location || "—" },
                { label: "Current Completion", value: `${selectedProject.completionPercentage || 0}%` },
              ]}
              footer={
                <div className="flex flex-wrap gap-2">
                  {!selectedProject.isDeleted ? (
                    <>
                      <button
                        type="button"
                        onClick={() => openQuickEdit(selectedProject)}
                        className="erp-action-btn erp-action-btn-secondary"
                      >
                        Quick Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(selectedProject)}
                        className="erp-action-btn erp-action-btn-primary"
                      >
                        Open Full Form Editor
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleRestore(selectedProject)}
                      className="erp-action-btn erp-action-btn-secondary"
                    >
                      Restore Project
                    </button>
                  )}
                </div>
              }
            />
          </div>
        )}

        {activeTab === "general" && (
          <div className={formPanelClassName}>
            <div className={formGridTwoClassName}>
              <div>
                <label className={formLabelClassName}>Target Company Master *</label>
                <select
                  value={selectedCompanyId}
                  onChange={(event) => setSelectedCompanyId(event.target.value)}
                  className={formSelectClassName}
                  disabled={Boolean(editingId)}
                >
                  <option value="">Select Company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={formLabelClassName}>Project Code Identifier *</label>
                <input
                  type="text"
                  name="projectCode"
                  value={formData.projectCode ?? ""}
                  onChange={handleInputChange}
                  placeholder="e.g. PRJ-2026-HR"
                  className={formInputClassName}
                />
              </div>

              <div>
                <label className={formLabelClassName}>Project Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name ?? ""}
                  onChange={handleInputChange}
                  placeholder="Enter project display name"
                  className={formInputClassName}
                />
              </div>

              <div>
                <label className={formLabelClassName}>Project Category Type</label>
                <input
                  type="text"
                  name="projectType"
                  value={formData.projectType ?? ""}
                  onChange={handleInputChange}
                  placeholder="e.g. Customer Project, Internal R&D"
                  className={formInputClassName}
                />
              </div>

              <div>
                <label className={formLabelClassName}>Priority Level</label>
                <select
                  name="priority"
                  value={formData.priority ?? ""}
                  onChange={handleInputChange}
                  className={formSelectClassName}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className={formLabelClassName}>Lifecycle Status</label>
                <select
                  name="status"
                  value={formData.status ?? ""}
                  onChange={handleInputChange}
                  className={formSelectClassName}
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className={formLabelClassName}>Project Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location ?? ""}
                  onChange={handleInputChange}
                  placeholder="e.g., Onsite (Delhi), Offshore"
                  className={formInputClassName}
                />
              </div>

              <div>
                <label className={formLabelClassName}>Project Manager ID</label>
                <input
                  type="text"
                  name="projectManagerId"
                  value={formData.projectManagerId ?? ""}
                  onChange={handleInputChange}
                  placeholder="Manager Employee ID"
                  className={formInputClassName}
                />
              </div>

              <div>
                <label className={formLabelClassName}>Completion Percentage</label>
                <input
                  type="number"
                  name="completionPercentage"
                  min="0"
                  max="100"
                  value={formData.completionPercentage ?? ""}
                  onChange={handleInputChange}
                  placeholder="0 to 100"
                  className={formInputClassName}
                />
              </div>
            </div>

            <div>
              <label className={formLabelClassName}>Scope Description Details</label>
              <textarea
                name="description"
                value={formData.description ?? ""}
                onChange={handleInputChange}
                placeholder="Scope statement and deliverables checklist..."
                rows={3}
                className={`${formInputClassName} h-auto py-2`}
              />
            </div>

            <div className="erp-kpi-action-footer border-t border-slate-100 pt-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="erp-action-btn erp-action-btn-primary disabled:opacity-50"
              >
                {editingId ? "Update Project" : "Register Project"}
              </button>
              <button onClick={handleCancel} className="erp-action-btn erp-action-btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}

        {activeTab === "financials" && (
          <div className={formPanelClassName}>
            <div className={formGridTwoClassName}>
              <div>
                <label className={formLabelClassName}>Currency Registry</label>
                <input
                  type="text"
                  name="currencyCode"
                  value={formData.currencyCode ?? ""}
                  onChange={handleInputChange}
                  placeholder="INR, USD, EUR"
                  className={formInputClassName}
                />
              </div>

              <div>
                <label className={formLabelClassName}>Budget Allocation</label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget ?? ""}
                  onChange={handleInputChange}
                  placeholder="Total budget amount"
                  className={formInputClassName}
                />
              </div>

              <div>
                <label className={formLabelClassName}>Actual Cost Expended</label>
                <input
                  type="number"
                  name="actualCost"
                  value={formData.actualCost ?? ""}
                  onChange={handleInputChange}
                  placeholder="Accumulated cost to date"
                  className={formInputClassName}
                />
              </div>

              <div>
                <label className={formLabelClassName}>Billing Structure</label>
                <select
                  name="billingType"
                  value={formData.billingType ?? ""}
                  onChange={handleInputChange}
                  className={formSelectClassName}
                >
                  <option value="Fixed Bid">Fixed Bid</option>
                  <option value="Time & Materials">Time & Materials</option>
                  <option value="Retainer">Retainer</option>
                  <option value="Non-Billable">Non-Billable</option>
                </select>
              </div>

              <div>
                <label className={formLabelClassName}>Scheduled Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate ?? ""}
                  onChange={handleInputChange}
                  className={formInputClassName}
                />
              </div>

              <div>
                <label className={formLabelClassName}>Scheduled End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate ?? ""}
                  onChange={handleInputChange}
                  className={formInputClassName}
                />
              </div>

              <div>
                <label className={formLabelClassName}>Actual Start Date</label>
                <input
                  type="date"
                  name="actualStartDate"
                  value={formData.actualStartDate ?? ""}
                  onChange={handleInputChange}
                  className={formInputClassName}
                />
              </div>

              <div>
                <label className={formLabelClassName}>Actual End Date</label>
                <input
                  type="date"
                  name="actualEndDate"
                  value={formData.actualEndDate ?? ""}
                  onChange={handleInputChange}
                  className={formInputClassName}
                />
              </div>
            </div>

            <div className="erp-kpi-action-footer border-t border-slate-100 pt-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="erp-action-btn erp-action-btn-primary disabled:opacity-50"
              >
                {editingId ? "Update Project" : "Register Project"}
              </button>
              <button onClick={handleCancel} className="erp-action-btn erp-action-btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}

        {activeTab === "client" && (
          <div className={formPanelClassName}>
            <div className={formGridTwoClassName}>
              <div>
                <label className={formLabelClassName}>Client Name</label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName ?? ""}
                  onChange={handleInputChange}
                  placeholder="Client Corporation / Legal Entity"
                  className={formInputClassName}
                />
              </div>

              <div>
                <label className={formLabelClassName}>Contract Reference Number</label>
                <input
                  type="text"
                  name="contractNumber"
                  value={formData.contractNumber ?? ""}
                  onChange={handleInputChange}
                  placeholder="Contract Ref / agreement ID"
                  className={formInputClassName}
                />
              </div>
            </div>

            <div className="erp-kpi-action-footer border-t border-slate-100 pt-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="erp-action-btn erp-action-btn-primary disabled:opacity-50"
              >
                {editingId ? "Update Project" : "Register Project"}
              </button>
              <button onClick={handleCancel} className="erp-action-btn erp-action-btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        )}

      <QuickEditDrawer
        open={Boolean(quickEditProject)}
        title="Quick Edit Project"
        subtitle="Fast rename/code/completion/status updates"
        onClose={() => setQuickEditProject(null)}
        onSave={() => void handleQuickEditSave()}
        saveLabel="Update Project"
        saving={quickEditSaving}
      >
        <div>
          <label className="erp-label">Project Name *</label>
          <input
            type="text"
            value={quickEditForm.name}
            onChange={(event) => setQuickEditForm((prev) => ({ ...prev, name: event.target.value }))}
            className="erp-input"
            placeholder="Enter project name"
          />
        </div>
        <div>
          <label className="erp-label">Project Code *</label>
          <input
            type="text"
            value={quickEditForm.projectCode}
            onChange={(event) => setQuickEditForm((prev) => ({ ...prev, projectCode: event.target.value }))}
            className="erp-input"
            placeholder="PRJ-2026-HR"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="erp-label">Progress (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={quickEditForm.completionPercentage}
              onChange={(event) => setQuickEditForm((prev) => ({ ...prev, completionPercentage: Number(event.target.value) }))}
              className="erp-input"
              placeholder="0"
            />
          </div>
          <div>
            <label className="erp-label">Status</label>
            <select
              value={quickEditForm.status}
              onChange={(event) => setQuickEditForm((prev) => ({ ...prev, status: event.target.value }))}
              className="erp-select"
            >
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </QuickEditDrawer>
    </div>
  );
}
