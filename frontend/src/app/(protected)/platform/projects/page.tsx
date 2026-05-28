"use client";

import { useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { useOrgContext } from "@/context/OrgContext";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import QuickEditDrawer from "@/components/ui/QuickEditDrawer";
import { usePermissions } from "@/context/PermissionContext";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionBar } from "@/components/table/BulkActionBar";
import { BulkEditDialog } from "@/components/table/BulkEditDialog";
import { SelectionCheckbox } from "@/components/table/SelectionCheckbox";
import { SelectAllCheckbox } from "@/components/table/SelectAllCheckbox";
import { TableActionMenu } from "@/components/table/TableActionMenu";
import type { BulkActionFieldConfig } from "@/features/shared/types/bulkActions";

const PROJECT_TYPES = ["Internal", "External", "R&D", "Maintenance", "CapEx", "OpEx"] as const;
const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
const STATUSES = ["Planned", "Active", "Completed", "Hold", "Cancelled"] as const;
const BILLING_TYPES = ["FixedPrice", "TimeAndMaterial", "Retainer", "NonBillable"] as const;
const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"] as const;

const priorityClass: Record<string, string> = {
  Low: "erp-chip erp-chip-neutral",
  Medium: "erp-chip erp-chip-info",
  High: "erp-chip erp-chip-warning",
  Critical: "erp-chip erp-chip-error",
};

const statusClass: Record<string, string> = {
  Planned: "erp-chip erp-chip-neutral",
  Active: "erp-chip erp-chip-success",
  Completed: "erp-chip erp-chip-info",
  Hold: "erp-chip erp-chip-warning",
  Cancelled: "erp-chip erp-chip-error",
};

interface ProjectRow {
  id: string;
  projectCode: string;
  name: string;
  companyId: string;
  companyName?: string;
  tenantId?: string;
  tenantName?: string;
  isDeleted?: boolean;
  projectType: string;
  priority: string;
  status: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  budget?: number;
  currencyCode: string;
  clientName?: string;
  billingType?: string;
  completionPercentage: number;
  location?: string;
}

interface CompanyOption {
  id: string;
  name: string;
  tenantId?: string;
  tenantName?: string;
}

interface ProjectFormState {
  name: string;
  companyId: string;
  tenantId: string;
  projectCode: string;
  description: string;
  projectType: string;
  priority: string;
  status: string;
  startDate: string;
  endDate: string;
  budget: string;
  currencyCode: string;
  clientName: string;
  contractNumber: string;
  billingType: string;
  completionPercentage: string;
  location: string;
  actualStartDate: string;
  actualEndDate: string;
  actualCost: string;
}

const emptyForm = (): ProjectFormState => ({
  name: "",
  companyId: "",
  tenantId: "",
  projectCode: "",
  description: "",
  projectType: "Internal",
  priority: "Medium",
  status: "Planned",
  startDate: "",
  endDate: "",
  budget: "",
  currencyCode: "INR",
  clientName: "",
  contractNumber: "",
  billingType: "",
  completionPercentage: "0",
  location: "",
  actualStartDate: "",
  actualEndDate: "",
  actualCost: "",
});

const toObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const readString = (raw: Record<string, unknown>, camel: string, pascal: string): string => {
  const v = raw[camel] ?? raw[pascal];
  return typeof v === "string" ? v : "";
};

const readNumber = (raw: Record<string, unknown>, camel: string, pascal: string): number | undefined => {
  const v = raw[camel] ?? raw[pascal];
  return typeof v === "number" ? v : undefined;
};

const readBoolean = (raw: Record<string, unknown>, camel: string, pascal: string): boolean | undefined => {
  const v = raw[camel] ?? raw[pascal];
  return typeof v === "boolean" ? v : undefined;
};

const normalizeCompanyOption = (value: unknown, index: number): CompanyOption => {
  const raw = toObject(value);
  return {
    id: readString(raw, "id", "Id") || `company-${index}`,
    name: readString(raw, "name", "Name") || "Unnamed company",
    tenantId: readString(raw, "tenantId", "TenantId") || undefined,
    tenantName: readString(raw, "tenantName", "TenantName") || undefined,
  };
};

const normalizeProjectRow = (value: unknown, index: number): ProjectRow => {
  const raw = toObject(value);
  return {
    id: readString(raw, "id", "Id") || `project-${index}`,
    projectCode: readString(raw, "projectCode", "ProjectCode"),
    name: readString(raw, "name", "Name"),
    companyId: readString(raw, "companyId", "CompanyId"),
    companyName: readString(raw, "companyName", "CompanyName") || undefined,
    tenantId: readString(raw, "tenantId", "TenantId") || undefined,
    tenantName: readString(raw, "tenantName", "TenantName") || undefined,
    isDeleted: readBoolean(raw, "isDeleted", "IsDeleted") ?? false,
    projectType: readString(raw, "projectType", "ProjectType") || "Internal",
    priority: readString(raw, "priority", "Priority") || "Medium",
    status: readString(raw, "status", "Status") || "Planned",
    isActive: readBoolean(raw, "isActive", "IsActive") ?? true,
    startDate: readString(raw, "startDate", "StartDate") || undefined,
    endDate: readString(raw, "endDate", "EndDate") || undefined,
    budget: readNumber(raw, "budget", "Budget"),
    currencyCode: readString(raw, "currencyCode", "CurrencyCode") || "INR",
    clientName: readString(raw, "clientName", "ClientName") || undefined,
    billingType: readString(raw, "billingType", "BillingType") || undefined,
    completionPercentage: readNumber(raw, "completionPercentage", "CompletionPercentage") ?? 0,
    location: readString(raw, "location", "Location") || undefined,
  };
};

const fmtDate = (iso?: string) => (iso ? iso.slice(0, 10) : "—");
const fmtCurrency = (amount?: number, code = "INR") =>
  amount != null
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(amount)
    : "—";

const parseFinancialYearRange = (financialYearLabel?: string | null): { start: Date; end: Date } | null => {
  if (!financialYearLabel) return null;
  const match = financialYearLabel.match(/(\d{4})\s*[-/]\s*(\d{2,4})/);
  if (!match) return null;
  const startYear = Number.parseInt(match[1], 10);
  if (Number.isNaN(startYear)) return null;

  // India financial year convention: Apr 1 to Mar 31
  const start = new Date(startYear, 3, 1, 0, 0, 0, 0);
  const end = new Date(startYear + 1, 2, 31, 23, 59, 59, 999);
  return { start, end };
};

const isProjectInFinancialYear = (project: ProjectRow, financialYearLabel?: string | null): boolean => {
  const range = parseFinancialYearRange(financialYearLabel);
  if (!range) return true;

  const startDateRaw = project.startDate ? new Date(project.startDate) : null;
  const endDateRaw = project.endDate ? new Date(project.endDate) : null;

  if (!startDateRaw && !endDateRaw) return true;

  const projectStart = startDateRaw || endDateRaw;
  const projectEnd = endDateRaw || startDateRaw;
  if (!projectStart || !projectEnd) return true;

  return projectStart <= range.end && projectEnd >= range.start;
};

export default function ProjectsPage() {
  const { confirm, confirmDialog } = useConfirmDialog();
  const { isSuperAdmin } = usePermissions();
  // Platform pages are global admin views – intentionally ignore topbar org context
  const { companyId: ctxCompanyId, projectId: ctxProjectId } = useOrgContext();

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [allTenants, setAllTenants] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectFormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  const hasCompanies = companies.length > 0;

  const setField = <K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const load = async (includeDeletedFlag?: boolean) => {
    setLoading(true);
    try {
      if (isSuperAdmin) {
        const [projectsRes, companiesRes] = await Promise.all([
          hrApi.project.getAll(ctxCompanyId || undefined, undefined, includeDeletedFlag ?? showDeleted),
          hrApi.company.getAllForSuperAdmin(),
        ]);
        const rawProjects = Array.isArray(toObject(projectsRes.data).projects)
          ? (toObject(projectsRes.data).projects as unknown[])
          : [];
        const rawCompanies = Array.isArray((companiesRes.data as Record<string, unknown>).companies)
          ? ((companiesRes.data as Record<string, unknown>).companies as unknown[])
          : [];
        const normalized = rawCompanies.map(normalizeCompanyOption);
        setProjects(rawProjects.map(normalizeProjectRow));
        setCompanies(normalized);
        const tenants = Array.from(new Set(normalized.map((c) => c.tenantName ?? "").filter(Boolean)));
        setAllTenants(tenants.sort());
      } else {
        const [projectsRes, companiesRes] = await Promise.all([
          hrApi.project.getAll(ctxCompanyId || undefined, undefined, false),
          hrApi.company.getAll(1, 200),
        ]);
        const rawProjects = Array.isArray(toObject(projectsRes.data).projects)
          ? (toObject(projectsRes.data).projects as unknown[])
          : [];
        const rawCompanies = Array.isArray(toObject(companiesRes.data).companies)
          ? (toObject(companiesRes.data).companies as unknown[])
          : [];
        setProjects(rawProjects.map(normalizeProjectRow));
        setCompanies(rawCompanies.map(normalizeCompanyOption));
        setAllTenants([]);
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load projects");
      setError(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  const visibleProjects = useMemo(() => {
    return projects.filter((project) => {
      if (showDeleted) {
        if (!project.isDeleted) return false;
      } else if (project.isDeleted) {
        return false;
      }
      // When a specific company/project is selected, filter accordingly
      if (ctxCompanyId && project.companyId !== ctxCompanyId) return false;
      if (ctxProjectId && project.id !== ctxProjectId) return false;
      return true;
    });
  }, [projects, showDeleted, ctxCompanyId, ctxProjectId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, ctxCompanyId]);

  // ─── Bulk selection ──────────────────────────────────────────────────────────
  const selection = useTableSelection<ProjectRow>();
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkApplying, setBulkApplying] = useState(false);

  const projectBulkFields: BulkActionFieldConfig[] = [
    { key: "priority", label: "Priority", fieldType: "select", options: [
      { value: "Low", label: "Low" }, { value: "Medium", label: "Medium" },
      { value: "High", label: "High" }, { value: "Critical", label: "Critical" },
    ]},
    { key: "status", label: "Status", fieldType: "select", options: [
      { value: "Planned", label: "Planned" }, { value: "Active", label: "Active" },
      { value: "Completed", label: "Completed" }, { value: "Hold", label: "Hold" },
      { value: "Cancelled", label: "Cancelled" },
    ]},
    { key: "billingType", label: "Billing Type", fieldType: "select", options: [
      { value: "FixedPrice", label: "Fixed Price" }, { value: "TimeAndMaterial", label: "Time & Material" },
      { value: "Retainer", label: "Retainer" }, { value: "NonBillable", label: "Non-Billable" },
    ]},
    { key: "currencyCode", label: "Currency", fieldType: "select", options: [
      { value: "INR", label: "INR" }, { value: "USD", label: "USD" },
      { value: "EUR", label: "EUR" }, { value: "GBP", label: "GBP" },
    ]},
  ];

  useEffect(() => {
    selection.setItems(visibleProjects);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleProjects]);

  const handleBulkDelete = async () => {
    const count = selection.selectionCount;
    const ok = await confirm({
      title: "Delete selected projects",
      message: `Delete ${count} selected project${count === 1 ? "" : "s"}? You can restore from the deleted list.`,
      confirmText: "Delete All",
      variant: "danger",
    });
    if (!ok) return;
    let successCount = 0;
    for (const project of selection.selectedItems) {
      try { await hrApi.project.delete(project.id); successCount += 1; } catch { /* continue */ }
    }
    selection.clearSelection();
    notifySuccess(`Deleted ${successCount} of ${count} project${count === 1 ? "" : "s"}.`);
    await load();
  };

  const handleBulkEdit = async (updates: Record<string, unknown>) => {
    setBulkApplying(true);
    let successCount = 0;
    const count = selection.selectionCount;
    for (const project of selection.selectedItems) {
      try {
        await hrApi.project.update(project.id, updates as Parameters<typeof hrApi.project.update>[1]);
        successCount += 1;
      } catch { /* continue */ }
    }
    setBulkApplying(false);
    setBulkEditOpen(false);
    selection.clearSelection();
    notifySuccess(`Updated ${successCount} of ${count} project${count === 1 ? "" : "s"}.`);
    await load();
  };

  const openCreate = () => {
    setError(null);
    setEditingId(null);
    setForm((prev) => ({ ...emptyForm(), companyId: prev.companyId || companies[0]?.id || "", tenantId: prev.tenantId || "" }));
    setShowForm(true);
  };

  const openEdit = (p: ProjectRow) => {
    setError(null);
    setEditingId(p.id);
    setForm({
      name: p.name,
      companyId: p.companyId,
      tenantId: p.tenantId || "",
      projectCode: p.projectCode,
      description: "",
      projectType: p.projectType,
      priority: p.priority,
      status: p.status,
      startDate: p.startDate ? p.startDate.slice(0, 10) : "",
      endDate: p.endDate ? p.endDate.slice(0, 10) : "",
      budget: p.budget != null ? String(p.budget) : "",
      currencyCode: p.currencyCode || "INR",
      clientName: p.clientName || "",
      contractNumber: "",
      billingType: p.billingType || "",
      completionPercentage: String(p.completionPercentage),
      location: p.location || "",
      actualStartDate: "",
      actualEndDate: "",
      actualCost: "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Project name is required.");
      return;
    }
    if (!hasCompanies) {
      setError("No companies found. Create a company first.");
      return;
    }
    if (!form.companyId) {
      setError("Company is required.");
      return;
    }

    const ok = await confirm({
      title: editingId ? "Update project" : "Create project",
      message: editingId
        ? `Confirm updating project "${form.name.trim()}"?`
        : `Confirm creating project "${form.name.trim()}"?`,
      confirmText: editingId ? "Update" : "Create",
    });
    if (!ok) return;

    const pct = parseInt(form.completionPercentage, 10);

    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        companyId: form.companyId,
        ...(isSuperAdmin && form.tenantId ? { tenantId: form.tenantId } : {}),
        projectCode: form.projectCode.trim() || undefined,
        description: form.description.trim() || undefined,
        projectType: form.projectType,
        priority: form.priority,
        status: form.status,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        budget: form.budget ? parseFloat(form.budget) : undefined,
        currencyCode: form.currencyCode,
        clientName: form.clientName.trim() || undefined,
        contractNumber: form.contractNumber.trim() || undefined,
        billingType: form.billingType || undefined,
        location: form.location.trim() || undefined,
      };

      if (editingId) {
        await hrApi.project.update(editingId, {
          ...payload,
          actualStartDate: form.actualStartDate || undefined,
          actualEndDate: form.actualEndDate || undefined,
          actualCost: form.actualCost ? parseFloat(form.actualCost) : undefined,
          completionPercentage: Number.isNaN(pct) ? 0 : pct,
        });
        notifySuccess("Project updated.");
      } else {
        await hrApi.project.create(payload);
        notifySuccess("Project created.");
      }

      closeForm();
      await load();
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to save project");
      setError(msg);
      notifyError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project: ProjectRow) => {
    const ok = await confirm({
      title: "Delete project",
      message: `Delete project "${project.name}"? It will move to deleted records and can be restored later.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;

    setError(null);
    try {
      await hrApi.project.delete(project.id);
      notifySuccess("Project deleted.");
      await load();
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to delete project");
      setError(msg);
      notifyError(msg);
    }
  };

  const handleRestore = async (project: ProjectRow) => {
    const ok = await confirm({
      title: "Restore project",
      message: `Restore project "${project.name}"?`,
      confirmText: "Restore",
    });
    if (!ok) return;

    setError(null);
    try {
      await hrApi.project.restore(project.id);
      notifySuccess("Project restored.");
      await load();
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to restore project");
      setError(msg);
      notifyError(msg);
    }
  };

  const handleHardDelete = async (project: ProjectRow) => {
    const ok = await confirm({
      title: "Permanent delete project",
      message: `Permanently delete project "${project.name}" from database? This cannot be undone.`,
      confirmText: "Permanent Delete",
      variant: "danger",
    });
    if (!ok) return;

    setError(null);
    try {
      await hrApi.platform.recycleBin.hardDelete("Projects", project.id);
      notifySuccess("Project permanently deleted.");
      await load();
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to permanently delete project");
      setError(msg);
      notifyError(msg);
    }
  };

  const handleToggleDeleted = async () => {
    const next = !showDeleted;
    setShowDeleted(next);
    await load(next);
  };

  return (
    <StandardPageLayout
      title="Projects"
      subtitle="Manage projects, cost centres, budgets, and delivery tracking."
      eyebrow="Administration / Delivery"
      icon="folder"
      actions={
        <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
          {isSuperAdmin && (
            <button
              onClick={handleToggleDeleted}
              className={`erp-action-btn w-full lg:w-auto ${showDeleted ? "erp-action-btn-warning" : "erp-action-btn-secondary"}`}
            >
              {showDeleted ? "Hide Deleted" : "Show Deleted"}
            </button>
          )}
          <button onClick={openCreate} className="erp-action-btn erp-action-btn-primary w-full lg:w-auto">
            New Project
          </button>
        </div>
      }
    >
      {confirmDialog}

      {/* KPI summary cards */}
      <div className="erp-kpi-grid mb-4">
        <div className="erp-kpi-card"><p className="erp-kpi-label">Total Projects</p><p className="erp-kpi-value">{projects.filter(p => !p.isDeleted).length}</p><p className="erp-kpi-meta">All tracked projects</p></div>
        <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Active</p><p className="erp-kpi-value erp-kpi-value-success">{projects.filter(p => p.status === 'Active' && !p.isDeleted).length}</p><p className="erp-kpi-meta">In delivery</p></div>
        <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Completed</p><p className="erp-kpi-value">{projects.filter(p => p.status === 'Completed').length}</p><p className="erp-kpi-meta">Delivered projects</p></div>
        <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Planned / Hold</p><p className="erp-kpi-value">{projects.filter(p => (p.status === 'Planned' || p.status === 'Hold') && !p.isDeleted).length}</p><p className="erp-kpi-meta">Pending start</p></div>
      </div>

      {error && <div className="erp-alert-error mb-4">{error}</div>}

      {/* Bulk action bar */}
      {selection.selectionCount > 0 && (
        <BulkActionBar
          selectionCount={selection.selectionCount}
          onEdit={() => setBulkEditOpen(true)}
          onRefresh={() => { selection.clearSelection(); void load(); }}
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

      <QuickEditDrawer
        open={showForm}
        title={editingId ? "Edit Project" : "New Project"}
        subtitle={editingId ? "Update project details below" : "Fill in the details to create a new project"}
        onClose={closeForm}
        onSave={handleSave}
        saveLabel={editingId ? "Update Project" : "Create Project"}
        saving={saving || !hasCompanies}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="erp-label">Project Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. ERP Phase 2"
                className="erp-input"
              />
            </div>
            <div>
              <label className="erp-label">Project Code <span className="font-normal text-slate-400">(auto if blank)</span></label>
              <input
                type="text"
                value={form.projectCode}
                onChange={(e) => setField("projectCode", e.target.value.toUpperCase())}
                placeholder="e.g. ERP-002"
                className="erp-input font-mono uppercase"
                maxLength={50}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {isSuperAdmin && (
              <div>
                <label className="erp-label">Tenant (SuperAdmin) *</label>
                <select
                  value={form.tenantId}
                  onChange={(e) => {
                    setField("tenantId", e.target.value);
                    setField("companyId", ""); // reset company when tenant changes
                  }}
                  className="erp-select"
                >
                  <option value="">All tenants</option>
                  {allTenants.map((t) => (
                    <option key={t} value={companies.find((c) => c.tenantName === t)?.tenantId ?? t}>{t}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="erp-label">Company *</label>
              <select
                value={form.companyId}
                onChange={(e) => {
                  const selected = companies.find((c) => c.id === e.target.value);
                  setField("companyId", e.target.value);
                  if (isSuperAdmin && selected?.tenantId) {
                    setField("tenantId", selected.tenantId);
                  }
                }}
                className="erp-select"
                disabled={!hasCompanies}
              >
                <option value="">{hasCompanies ? "Select company" : "No companies"}</option>
                {(isSuperAdmin && form.tenantId
                  ? companies.filter((c) => c.tenantId === form.tenantId)
                  : companies
                ).map((c) => (
                  <option key={c.id} value={c.id}>
                    {isSuperAdmin && !form.tenantId ? `${c.tenantName ?? ""} — ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="erp-label">Project Type</label>
              <select value={form.projectType} onChange={(e) => setField("projectType", e.target.value)} className="erp-select">
                {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="erp-label">Priority</label>
              <select value={form.priority} onChange={(e) => setField("priority", e.target.value)} className="erp-select">
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="erp-label">Status</label>
              <select value={form.status} onChange={(e) => setField("status", e.target.value)} className="erp-select">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="erp-label">Billing Type</label>
              <select value={form.billingType} onChange={(e) => setField("billingType", e.target.value)} className="erp-select">
                <option value="">— select —</option>
                {BILLING_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="erp-label">Currency</label>
              <select value={form.currencyCode} onChange={(e) => setField("currencyCode", e.target.value)} className="erp-select">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="erp-label">Start Date (Planned)</label>
              <input type="date" value={form.startDate} onChange={(e) => setField("startDate", e.target.value)} className="erp-input" />
            </div>
            <div>
              <label className="erp-label">End Date (Planned)</label>
              <input type="date" value={form.endDate} onChange={(e) => setField("endDate", e.target.value)} className="erp-input" />
            </div>
          </div>

          {editingId && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="erp-label">Actual Start</label>
                <input type="date" value={form.actualStartDate} onChange={(e) => setField("actualStartDate", e.target.value)} className="erp-input" />
              </div>
              <div>
                <label className="erp-label">Actual End</label>
                <input type="date" value={form.actualEndDate} onChange={(e) => setField("actualEndDate", e.target.value)} className="erp-input" />
              </div>
              <div>
                <label className="erp-label">Actual Cost ({form.currencyCode})</label>
                <input type="number" min={0} value={form.actualCost} onChange={(e) => setField("actualCost", e.target.value)} placeholder="0" className="erp-input" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="erp-label">Budget ({form.currencyCode})</label>
              <input type="number" min={0} value={form.budget} onChange={(e) => setField("budget", e.target.value)} placeholder="0" className="erp-input" />
            </div>
            <div>
              <label className="erp-label">Client Name</label>
              <input type="text" value={form.clientName} onChange={(e) => setField("clientName", e.target.value)} placeholder="External client" className="erp-input" />
            </div>
            <div>
              <label className="erp-label">Contract / PO Number</label>
              <input type="text" value={form.contractNumber} onChange={(e) => setField("contractNumber", e.target.value)} placeholder="PO-2024-001" className="erp-input" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="erp-label">Location</label>
              <input type="text" value={form.location} onChange={(e) => setField("location", e.target.value)} placeholder="Mumbai / Remote" className="erp-input" />
            </div>
            {editingId && (
              <div>
                <label className="erp-label">Completion % ({form.completionPercentage}%)</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={form.completionPercentage}
                  onChange={(e) => setField("completionPercentage", e.target.value)}
                  className="w-full accent-blue-600"
                />
              </div>
            )}
          </div>

          <div>
            <label className="erp-label">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Brief project description…"
              className="erp-input resize-none"
            />
          </div>

        </div>
      </QuickEditDrawer>

      <div className="erp-panel">
        <div className="erp-table-toolbar">
          <div>
            <div className="erp-table-title">Project registry</div>
            <div className="erp-table-subtitle">
              {isSuperAdmin
                ? "All projects across all tenants — SuperAdmin view."
                : "All projects across companies — budgets, status, and delivery progress."}
            </div>
          </div>
          <span className="erp-toolbar-badge">{loading ? "Loading…" : `${visibleProjects.length} project${visibleProjects.length !== 1 ? "s" : ""}`}</span>
        </div>

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
                <th className="erp-th">Project</th>
                {isSuperAdmin && <th className="erp-th">Tenant</th>}
                <th className="erp-th">Company</th>
                <th className="erp-th">Type / Priority</th>
                <th className="erp-th">Status</th>
                <th className="erp-th">Budget</th>
                <th className="erp-th">Dates</th>
                <th className="erp-th">Progress</th>
                <th className="erp-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleProjects.map((p) => (
                <tr key={p.id} className={`erp-tr${p.isDeleted ? " opacity-50 bg-red-50" : ""}`}>
                  <td className="erp-td">
                    <SelectionCheckbox
                      checked={selection.isSelected(p.id)}
                      onChange={() => selection.toggleSelection(p.id)}
                      label={`Select ${p.name}`}
                    />
                  </td>
                  <td className="erp-td">
                    <div className="flex items-center gap-2">
                      <div className="erp-row-title">{p.name}</div>
                      {p.isDeleted && <span className="erp-chip erp-chip-error text-xs">Deleted</span>}
                    </div>
                    <div className="erp-row-meta font-mono text-xs">{p.projectCode || "—"}</div>
                    {p.clientName && <div className="erp-row-meta">Client: {p.clientName}</div>}
                  </td>
                  {isSuperAdmin && <td className="erp-td text-xs text-slate-500">{p.tenantName || p.tenantId || "—"}</td>}
                  <td className="erp-td">{p.companyName || p.companyId}</td>
                  <td className="erp-td">
                    <div className="text-xs text-slate-600">{p.projectType}</div>
                    <span className={priorityClass[p.priority] ?? "erp-chip erp-chip-neutral"}>{p.priority}</span>
                  </td>
                  <td className="erp-td">
                    <span className={statusClass[p.status] ?? "erp-chip erp-chip-neutral"}>{p.status}</span>
                    {p.billingType && <div className="mt-1 text-xs text-slate-500">{p.billingType}</div>}
                  </td>
                  <td className="erp-td text-right font-mono text-sm">{fmtCurrency(p.budget, p.currencyCode)}</td>
                  <td className="erp-td text-xs text-slate-600">
                    <div>{fmtDate(p.startDate)} →</div>
                    <div>{fmtDate(p.endDate)}</div>
                  </td>
                  <td className="erp-td">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${p.completionPercentage}%` }} />
                      </div>
                      <span className="text-xs text-slate-600">{p.completionPercentage}%</span>
                    </div>
                  </td>
                  <td className="erp-td">
                    <TableActionMenu
                      items={
                        !p.isDeleted
                          ? isSuperAdmin
                            ? [
                                { label: "Edit", onClick: () => openEdit(p) },
                                { label: "Delete", onClick: () => void handleDelete(p), danger: true },
                              ]
                            : [{ label: "View Project", onClick: () => openEdit(p) }]
                          : isSuperAdmin
                            ? [
                                { label: "Restore", onClick: () => void handleRestore(p) },
                                { label: "Permanent Delete", onClick: () => void handleHardDelete(p), danger: true },
                              ]
                            : [{ label: "View Project", onClick: () => openEdit(p) }]
                      }
                    />
                  </td>
                </tr>
              ))}
              {!loading && visibleProjects.length === 0 && (
                <tr>
                  <td colSpan={isSuperAdmin ? 9 : 8} className="erp-td py-10 text-center text-slate-500">
                    {showDeleted ? "No deleted projects found for selected filters." : "No projects found for selected filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </StandardPageLayout>
  );
}
