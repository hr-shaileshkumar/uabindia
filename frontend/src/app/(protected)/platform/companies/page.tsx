"use client";

import { useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { useAuth } from "@/context/AuthContext";
import { hrApi } from "@/services/hrApi";
import { useOrgContext } from "@/context/OrgContext";
import { getApiErrorMessage } from "@/lib/api-errors";
import { isSuperAdminRole } from "@/lib/auth/role-utils";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { useCompanies, useCompanyMutations, useTenants } from "@/features/companies/hooks";
import type { CompanyDraft, CompanyMutationPayload, CompanyRecord, TenantSummary } from "@/features/companies/types";
import { useTableSelection } from "@/hooks/useTableSelection";
import { BulkActionBar } from "@/components/table/BulkActionBar";
import { BulkEditDialog } from "@/components/table/BulkEditDialog";
import { SelectionCheckbox } from "@/components/table/SelectionCheckbox";
import { SelectAllCheckbox } from "@/components/table/SelectAllCheckbox";
import { TableActionMenu } from "@/components/table/TableActionMenu";
import QuickEditDrawer from "@/components/ui/QuickEditDrawer";
import EntityProfileCard from "@/components/ui/EntityProfileCard";
import type { BulkActionFieldConfig } from "@/features/shared/types/bulkActions";

type TabKey = "list" | "general" | "address" | "banking" | "contacts";

type QuickCompanyEditState = {
  name: string;
  code: string;
  city: string;
  isActive: boolean;
};

const PAGE_SIZE = 100;
const EMPTY_COMPANIES: CompanyRecord[] = [];
const EMPTY_TENANTS: TenantSummary[] = [];

const createEmptyCompanyForm = (): CompanyDraft => ({
  isActive: true,
});

const getCurrentSubdomain = () => {
  if (typeof window === "undefined") return "";

  const hostname = window.location.hostname.toLowerCase();
  if (hostname.endsWith(".localhost") && hostname !== "localhost" && hostname !== "127.0.0.1") {
    return hostname.split(".")[0] || "";
  }

  return "";
};

const normalizePayload = (data: CompanyDraft): CompanyMutationPayload => {
  const payload: CompanyMutationPayload = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value === "" || value === null || typeof value === "undefined") {
      return;
    }

    if (key === "maxEmployees") {
      const numericValue = typeof value === "string" ? Number(value) : value;
      if (!Number.isNaN(numericValue)) {
        payload.maxEmployees = numericValue;
      }
      return;
    }

    const payloadKey = key as keyof CompanyMutationPayload;
    payload[payloadKey] = value as never;
  });

  return payload;
};

export default function CompaniesPage() {
  const { confirm, confirmDialog } = useConfirmDialog();
  const { user } = useAuth();
  // Platform pages are global admin views – intentionally ignore topbar org context
  const { companyId: ctxCompanyId } = useOrgContext();
  const roles = (user as { roles?: string[] } | null)?.roles || [];
  const isSuperAdmin = roles.some((role) => isSuperAdminRole(role));
  const currentPage = 1;

  const [activeTab, setActiveTab] = useState<TabKey>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [tenantFilterSubdomain, setTenantFilterSubdomain] = useState<string | undefined>(undefined);
  const [showDeleted, setShowDeleted] = useState(false);
  const [formData, setFormData] = useState<CompanyDraft>(createEmptyCompanyForm);
  const [selectedCompany, setSelectedCompany] = useState<CompanyRecord | null>(null);
  const [quickEditCompany, setQuickEditCompany] = useState<CompanyRecord | null>(null);
  const [quickEditSaving, setQuickEditSaving] = useState(false);
  const [quickEditForm, setQuickEditForm] = useState<QuickCompanyEditState>({
    name: "",
    code: "",
    city: "",
    isActive: true,
  });
  const [actionError, setActionError] = useState<string | null>(null);

  const companiesQuery = useCompanies(currentPage, PAGE_SIZE, tenantFilterSubdomain, showDeleted);
  const tenantsQuery = useTenants(isSuperAdmin);
  const { createCompanyMutation, updateCompanyMutation, deleteCompanyMutation } = useCompanyMutations();

  const companies = companiesQuery.data?.companies ?? EMPTY_COMPANIES;
  const tenants = tenantsQuery.data?.tenants ?? EMPTY_TENANTS;

  const filteredCompanies = useMemo(() => {
    const visibilityFiltered = companies.filter((company) => {
      if (showDeleted) {
        return !!company.isDeleted;
      }
      return !company.isDeleted;
    });

    // When a specific company is selected, show only that company
    if (ctxCompanyId) {
      return visibilityFiltered.filter((company) => company.id === ctxCompanyId);
    }
    return visibilityFiltered;
  }, [companies, showDeleted, ctxCompanyId]);
  const loading = companiesQuery.isLoading;
  const saving = createCompanyMutation.isPending || updateCompanyMutation.isPending;

  // ─── Bulk selection ──────────────────────────────────────────────────────────
  const selection = useTableSelection<CompanyRecord>();
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkApplying, setBulkApplying] = useState(false);

  const companyBulkFields: BulkActionFieldConfig[] = [
    { key: "isActive", label: "Active Status", fieldType: "boolean" },
    { key: "companySize", label: "Company Size", fieldType: "select", options: [
      { value: "Small", label: "Small" }, { value: "Medium", label: "Medium" },
      { value: "Large", label: "Large" }, { value: "Enterprise", label: "Enterprise" },
    ]},
    { key: "industry", label: "Industry", fieldType: "text", placeholder: "IT Services" },
  ];

  useEffect(() => {
    selection.setItems(filteredCompanies);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCompanies]);

  const handleBulkDelete = async () => {
    const count = selection.selectionCount;
    const ok = await confirm({
      title: "Delete selected companies",
      message: `Delete ${count} selected company${count === 1 ? "" : "s"}? This is a soft delete.`,
      confirmText: "Delete All",
      variant: "danger",
    });
    if (!ok) return;
    let successCount = 0;
    for (const company of selection.selectedItems) {
      try { await deleteCompanyMutation.mutateAsync(company.id); successCount += 1; } catch { /* continue */ }
    }
    selection.clearSelection();
    notifySuccess(`Deleted ${successCount} of ${count} company${count === 1 ? "" : "s"}.`);
  };

  const handleBulkEdit = async (updates: Record<string, unknown>) => {
    setBulkApplying(true);
    let successCount = 0;
    const count = selection.selectionCount;
    for (const company of selection.selectedItems) {
      try {
        await updateCompanyMutation.mutateAsync({ id: company.id, payload: updates as CompanyMutationPayload });
        successCount += 1;
      } catch { /* continue */ }
    }
    setBulkApplying(false);
    setBulkEditOpen(false);
    selection.clearSelection();
    notifySuccess(`Updated ${successCount} of ${count} company${count === 1 ? "" : "s"}.`);
  };

  const error =
    actionError ||
    (companiesQuery.error ? getApiErrorMessage(companiesQuery.error, "Failed to load companies") : null) ||
    (tenantsQuery.error ? getApiErrorMessage(tenantsQuery.error, "Failed to load tenants") : null);

  useEffect(() => {
    if (!isSuperAdmin || selectedTenantId || tenants.length === 0) {
      return;
    }

    const currentSubdomain = getCurrentSubdomain();
    if (!currentSubdomain) {
      return;
    }

    const matchingTenant = tenants.find((tenant) => tenant.subdomain === currentSubdomain);
    if (matchingTenant?.id) {
      setSelectedTenantId(matchingTenant.id);
    }
  }, [isSuperAdmin, selectedTenantId, tenants]);

  useEffect(() => {
    if (!isSuperAdmin || tenants.length === 0) {
      return;
    }

    if (!selectedTenantId) {
      setTenantFilterSubdomain(undefined);
      return;
    }

    const selected = tenants.find((tenant) => tenant.id === selectedTenantId);
    setTenantFilterSubdomain(selected?.subdomain);
  }, [isSuperAdmin, selectedTenantId, tenants]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = event.target;
    const fieldName = target.name as keyof CompanyDraft;
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
      setActionError("Company name is required");
      return;
    }

    if (!editingId && isSuperAdmin && !selectedTenantId) {
      setActionError("Tenant is required for SuperAdmin");
      return;
    }

    const ok = await confirm({
      title: editingId ? "Update company" : "Create company",
      message: editingId
        ? `Confirm updating company "${(formData.name || "").trim()}"?`
        : `Confirm creating company "${(formData.name || "").trim()}"?`,
      confirmText: editingId ? "Update" : "Create",
    });
    if (!ok) {
      return;
    }

    try {
      setActionError(null);
      const payload = normalizePayload(formData);

      if (editingId) {
        await updateCompanyMutation.mutateAsync({ id: editingId, payload });
        notifySuccess("Company updated successfully.");
      } else {
        const selectedTenant = tenants.find((tenant) => tenant.id === selectedTenantId);
        await createCompanyMutation.mutateAsync({
          payload,
          tenant: selectedTenant?.subdomain,
        });
        setTenantFilterSubdomain(selectedTenant?.subdomain);
        await companiesQuery.refetch();
        notifySuccess("Company created successfully.");
      }

      setFormData(createEmptyCompanyForm());
      setEditingId(null);
      setActiveTab("list");
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to save company");
      setActionError(message);
      notifyError(message);
    }
  };

  const handleEdit = (company: CompanyRecord) => {
    setActionError(null);
    setFormData({
      ...company,
      maxEmployees: company.maxEmployees,
      isActive: company.isActive,
    });
    setEditingId(company.id);

    if (company.tenantId) {
      setSelectedTenantId(company.tenantId);
    }

    setActiveTab("general");
  };

  const openQuickEdit = (company: CompanyRecord) => {
    setQuickEditCompany(company);
    setQuickEditForm({
      name: company.name || "",
      code: company.code || "",
      city: company.city || "",
      isActive: company.isActive,
    });
  };

  const closeQuickEdit = () => {
    setQuickEditCompany(null);
  };

  const handleQuickEditSave = async () => {
    if (!quickEditCompany) return;
    if (!quickEditForm.name.trim()) {
      setActionError("Company name is required");
      return;
    }

    const ok = await confirm({
      title: "Quick update company",
      message: `Confirm quick update for "${quickEditForm.name.trim()}"?`,
      confirmText: "Update",
    });
    if (!ok) return;

    try {
      setQuickEditSaving(true);
      await updateCompanyMutation.mutateAsync({
        id: quickEditCompany.id,
        payload: {
          name: quickEditForm.name.trim(),
          code: quickEditForm.code.trim() || undefined,
          city: quickEditForm.city.trim() || undefined,
          isActive: quickEditForm.isActive,
        },
      });
      notifySuccess("Company quick-updated successfully.");
      closeQuickEdit();
      await companiesQuery.refetch();
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to quick update company");
      setActionError(message);
      notifyError(message);
    } finally {
      setQuickEditSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete company",
      message: "Delete this company? It will move to deleted records and can be restored later.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) {
      return;
    }

    try {
      await deleteCompanyMutation.mutateAsync(id);
      setActionError(null);
      notifySuccess("Company deleted successfully.");
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to delete company");
      setActionError(message);
      notifyError(message);
    }
  };

  const handleRestore = async (company: CompanyRecord) => {
    try {
      await hrApi.platform.recycleBin.restore("Companies", company.id);
      setActionError(null);
      notifySuccess("Company restored successfully.");
      await companiesQuery.refetch();
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to restore company");
      setActionError(message);
      notifyError(message);
    }
  };

  const handleHardDelete = async (company: CompanyRecord) => {
    const ok = await confirm({
      title: "Permanent delete company",
      message: `Permanently delete company "${company.name}" from database? This cannot be undone.`,
      confirmText: "Permanent Delete",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await hrApi.platform.recycleBin.hardDelete("Companies", company.id);
      setActionError(null);
      notifySuccess("Company permanently deleted.");
      await companiesQuery.refetch();
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to permanently delete company");
      setActionError(message);
      notifyError(message);
    }
  };

  const handleNew = () => {
    setActionError(null);
    setFormData(createEmptyCompanyForm());
    setEditingId(null);
    setActiveTab("general");
  };

  const handleCancel = () => {
    setActionError(null);
    setFormData(createEmptyCompanyForm());
    setEditingId(null);
    setActiveTab("list");
  };

  return (
    <StandardPageLayout
      title="Company Master"
      subtitle="Manage company details, tenant mapping, and core platform configurations."
      eyebrow="Administration / Master Data"
      icon="building"
      actions={
        activeTab === "list" ? (
          <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
            {isSuperAdmin && (
              <select
                value={tenantFilterSubdomain || ""}
                onChange={(event) => {
                  const nextSubdomain = event.target.value || undefined;
                  setTenantFilterSubdomain(nextSubdomain);
                }}
                className="erp-select w-full min-w-0 lg:min-w-[320px]"
                aria-label="Filter companies by tenant"
              >
                <option value="">All Companies</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.subdomain}>
                    {tenant.name} ({tenant.subdomain})
                  </option>
                ))}
              </select>
            )}
            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              {isSuperAdmin && (
                <button
                  onClick={() => setShowDeleted((prev) => !prev)}
                  className={`erp-action-btn ${showDeleted ? "erp-action-btn-warning" : "erp-action-btn-secondary"}`}
                >
                  {showDeleted ? "Hide Deleted" : "Show Deleted"}
                </button>
              )}
              <button onClick={handleNew} className="erp-action-btn erp-action-btn-primary">
                Create Company
              </button>
            </div>
          </div>
        ) : undefined
      }
    >
      {confirmDialog}

      {/* KPI summary cards */}
      <div className="erp-kpi-grid mb-4">
        <div className="erp-kpi-card"><p className="erp-kpi-label">Total Companies</p><p className="erp-kpi-value">{companies.length}</p><p className="erp-kpi-meta">Registered companies</p></div>
        <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Active</p><p className="erp-kpi-value erp-kpi-value-success">{companies.filter((c: CompanyRecord) => c.isActive).length}</p><p className="erp-kpi-meta">Operational companies</p></div>
        <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Inactive</p><p className="erp-kpi-value">{companies.filter((c: CompanyRecord) => !c.isActive).length}</p><p className="erp-kpi-meta">Suspended accounts</p></div>
        <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Filtered View</p><p className="erp-kpi-value">{filteredCompanies.length}</p><p className="erp-kpi-meta">Matching search criteria</p></div>
      </div>

      {error && <div className="erp-alert-error">{error}</div>}

      {/* Bulk action bar */}
      {activeTab === "list" && selection.selectionCount > 0 && (
        <BulkActionBar
          selectionCount={selection.selectionCount}
          onEdit={() => setBulkEditOpen(true)}
          onRefresh={() => { selection.clearSelection(); void companiesQuery.refetch(); }}
          onDelete={() => void handleBulkDelete()}
          onClear={selection.clearSelection}
          loading={bulkApplying}
        />
      )}

      {bulkEditOpen && (
        <BulkEditDialog
          fields={companyBulkFields}
          selectionCount={selection.selectionCount}
          onApply={handleBulkEdit}
          onClose={() => setBulkEditOpen(false)}
          loading={bulkApplying}
        />
      )}

      <div className="overflow-x-auto border-b border-gray-200">
        <div className="flex min-w-max gap-2">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
              activeTab === "list"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Companies ({filteredCompanies.length})
          </button>
          {(editingId || activeTab !== "list") && (
            <>
              <button
                onClick={() => setActiveTab("general")}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                  activeTab === "general"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                General Information
              </button>
              <button
                onClick={() => setActiveTab("address")}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                  activeTab === "address"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Address Details
              </button>
              <button
                onClick={() => setActiveTab("banking")}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                  activeTab === "banking"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Banking Information
              </button>
              <button
                onClick={() => setActiveTab("contacts")}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                  activeTab === "contacts"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Contacts
              </button>
            </>
          )}
        </div>
      </div>

      {activeTab === "list" && (
        <div className="erp-panel overflow-hidden">
          <div className="erp-table-toolbar">
            <div>
              <div className="erp-table-title">Company registry</div>
              <div className="erp-table-subtitle">
                Review master records, tenant linkage, and activation state with a mobile-safe company ledger.
              </div>
            </div>
            <span className="erp-toolbar-badge">
              {companiesQuery.isFetching ? "Refreshing..." : `${filteredCompanies.length} companies`}
            </span>
          </div>
          {loading ? (
            <div className="erp-panel-body">
              <div className="erp-loading">Loading companies...</div>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="erp-panel-body">
              <div className="erp-empty">
                {showDeleted
                  ? "No deleted companies found."
                  : "No companies found. Click \"New Company\" to add one."}
              </div>
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
                    <th className="erp-th">Name</th>
                    <th className="erp-th">Tenant ID</th>
                    <th className="erp-th">Code</th>
                    <th className="erp-th">City</th>
                    <th className="erp-th">Email</th>
                    <th className="erp-th">Status</th>
                    <th className="erp-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((company) => (
                    <tr key={company.id} className={`erp-tr${company.isDeleted ? " opacity-50 bg-red-50" : ""}`}>
                      <td className="erp-td">
                        <SelectionCheckbox
                          checked={selection.isSelected(company.id)}
                          onChange={() => selection.toggleSelection(company.id)}
                          label={`Select ${company.name}`}
                        />
                      </td>
                      <td className="erp-td">
                        <div className="erp-row-title">{company.name}</div>
                        <div className="erp-row-meta">{company.legalName || "Company master record"}</div>
                      </td>
                      <td className="erp-td text-xs text-slate-500">{company.tenantId || "-"}</td>
                      <td className="erp-td text-slate-600">{company.code || "-"}</td>
                      <td className="erp-td text-slate-600">{company.city || "-"}</td>
                      <td className="erp-td text-slate-600">{company.email || "-"}</td>
                      <td className="erp-td">
                        <span className={company.isDeleted ? "erp-chip erp-chip-error" : company.isActive ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
                          {company.isDeleted ? "Deleted" : company.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="erp-td">
                        <TableActionMenu
                          items={
                            !company.isDeleted
                              ? isSuperAdmin
                                ? [
                                    { label: "View Details", onClick: () => setSelectedCompany(company) },
                                    { label: "Quick Edit", onClick: () => openQuickEdit(company) },
                                    { label: "Open Full Edit", onClick: () => handleEdit(company) },
                                    { label: "Delete", onClick: () => void handleDelete(company.id), danger: true, disabled: deleteCompanyMutation.isPending },
                                  ]
                                : [{ label: "View Details", onClick: () => setSelectedCompany(company) }]
                              : isSuperAdmin
                                ? [
                                    { label: "Restore", onClick: () => void handleRestore(company) },
                                    { label: "Permanent Delete", onClick: () => void handleHardDelete(company), danger: true },
                                  ]
                                : [{ label: "View Details", onClick: () => setSelectedCompany(company) }]
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

      {activeTab === "list" && selectedCompany && (
        <div className="mt-4">
          <EntityProfileCard
            title={selectedCompany.name}
            subtitle={selectedCompany.legalName || "Company profile"}
            badge={
              <span className={selectedCompany.isDeleted ? "erp-chip erp-chip-danger" : selectedCompany.isActive ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
                {selectedCompany.isDeleted ? "Deleted" : selectedCompany.isActive ? "Active" : "Inactive"}
              </span>
            }
            items={[
              { label: "Code", value: selectedCompany.code || "—" },
              { label: "City", value: selectedCompany.city || "—" },
              { label: "Email", value: selectedCompany.email || "—" },
              { label: "Tenant", value: selectedCompany.tenantId || "—" },
            ]}
            footer={
              <div className="flex flex-wrap gap-2">
                {!selectedCompany.isDeleted ? (
                  <>
                    <button type="button" onClick={() => openQuickEdit(selectedCompany)} className="erp-action-btn erp-action-btn-secondary">
                      Quick Edit
                    </button>
                    <button type="button" onClick={() => handleEdit(selectedCompany)} className="erp-action-btn erp-action-btn-primary">
                      Open Full Edit
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => void handleRestore(selectedCompany)} className="erp-action-btn erp-action-btn-secondary">
                    Restore
                  </button>
                )}
              </div>
            }
          />
        </div>
      )}

      {activeTab === "general" && (
        <div className="erp-panel erp-panel-body erp-kpi-card erp-kpi-card-info erp-kpi-action-card space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {isSuperAdmin && !editingId && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Tenant *</label>
                <select
                  name="tenantId"
                  value={selectedTenantId}
                  onChange={(event) => setSelectedTenantId(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Tenant</option>
                  {tenants.map((tenant: TenantSummary) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.subdomain})
                    </option>
                  ))}
                </select>
                {tenantsQuery.isLoading && <p className="mt-1 text-xs text-gray-500">Loading tenants...</p>}
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Company Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name ?? ""}
                onChange={handleInputChange}
                placeholder="Enter company name"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {formData.tenantId && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Tenant ID</label>
                <input
                  type="text"
                  value={formData.tenantId}
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-500"
                />
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Legal Name</label>
              <input
                type="text"
                name="legalName"
                value={formData.legalName ?? ""}
                onChange={handleInputChange}
                placeholder="Enter legal name"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Company Code</label>
              <input
                type="text"
                name="code"
                value={formData.code ?? ""}
                onChange={handleInputChange}
                placeholder="e.g., COMP001"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Industry</label>
              <input
                type="text"
                name="industry"
                value={formData.industry ?? ""}
                onChange={handleInputChange}
                placeholder="e.g., IT Services"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Company Size</label>
              <select
                name="companySize"
                value={formData.companySize ?? ""}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Size</option>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Max Employees</label>
              <input
                type="number"
                name="maxEmployees"
                value={formData.maxEmployees ?? ""}
                onChange={handleInputChange}
                placeholder="e.g., 500"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email ?? ""}
                onChange={handleInputChange}
                placeholder="company@example.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber ?? ""}
                onChange={handleInputChange}
                placeholder="+91 XXXXX XXXXX"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Website URL</label>
              <input
                type="url"
                name="websiteUrl"
                value={formData.websiteUrl ?? ""}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Registration Number</label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber ?? ""}
                onChange={handleInputChange}
                placeholder="CIN/Registration Number"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Tax ID (GST/PAN)</label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId ?? ""}
                onChange={handleInputChange}
                placeholder="GST/PAN Number"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Financial Year Start (MM-DD)</label>
              <input
                type="text"
                name="financialYearStart"
                value={formData.financialYearStart ?? ""}
                onChange={handleInputChange}
                placeholder="04-01"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Financial Year End (MM-DD)</label>
              <input
                type="text"
                name="financialYearEnd"
                value={formData.financialYearEnd ?? ""}
                onChange={handleInputChange}
                placeholder="03-31"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-semibold text-gray-700">Active</span>
            </label>
          </div>
          <div className="erp-kpi-action-footer border-t border-slate-100 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="erp-action-btn erp-action-btn-primary disabled:opacity-50"
            >
              {editingId ? "Update Company" : "Create Company"}
            </button>
            <button
              onClick={handleCancel}
              className="erp-action-btn erp-action-btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {activeTab === "address" && (
        <div className="erp-panel erp-panel-body erp-kpi-card erp-kpi-card-info erp-kpi-action-card space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Registration Address</label>
              <textarea
                name="registrationAddress"
                value={formData.registrationAddress ?? ""}
                onChange={handleInputChange}
                placeholder="Full registration address"
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Operational Address</label>
              <textarea
                name="operationalAddress"
                value={formData.operationalAddress ?? ""}
                onChange={handleInputChange}
                placeholder="Full operational address"
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">City</label>
              <input
                type="text"
                name="city"
                value={formData.city ?? ""}
                onChange={handleInputChange}
                placeholder="City"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">State/Province</label>
              <input
                type="text"
                name="state"
                value={formData.state ?? ""}
                onChange={handleInputChange}
                placeholder="State/Province"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Postal Code</label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode ?? ""}
                onChange={handleInputChange}
                placeholder="Postal Code"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country ?? ""}
                onChange={handleInputChange}
                placeholder="Country"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="erp-kpi-action-footer border-t border-slate-100 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="erp-action-btn erp-action-btn-primary disabled:opacity-50"
            >
              {editingId ? "Update Company" : "Create Company"}
            </button>
            <button
              onClick={handleCancel}
              className="erp-action-btn erp-action-btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {activeTab === "banking" && (
        <div className="erp-panel erp-panel-body erp-kpi-card erp-kpi-card-info erp-kpi-action-card space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName ?? ""}
                onChange={handleInputChange}
                placeholder="Bank Name"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Bank Branch</label>
              <input
                type="text"
                name="bankBranch"
                value={formData.bankBranch ?? ""}
                onChange={handleInputChange}
                placeholder="Branch Name"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Account Number</label>
              <input
                type="text"
                name="bankAccountNumber"
                value={formData.bankAccountNumber ?? ""}
                onChange={handleInputChange}
                placeholder="Account Number"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">IFSC Code</label>
              <input
                type="text"
                name="ifscCode"
                value={formData.ifscCode ?? ""}
                onChange={handleInputChange}
                placeholder="IFSC Code"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="erp-kpi-action-footer border-t border-slate-100 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="erp-action-btn erp-action-btn-primary disabled:opacity-50"
            >
              {editingId ? "Update Company" : "Create Company"}
            </button>
            <button
              onClick={handleCancel}
              className="erp-action-btn erp-action-btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {activeTab === "contacts" && (
        <div className="erp-panel erp-panel-body erp-kpi-card erp-kpi-card-info erp-kpi-action-card space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Main Contact Person</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Contact Name</label>
                <input
                  type="text"
                  name="contactPersonName"
                  value={formData.contactPersonName ?? ""}
                  onChange={handleInputChange}
                  placeholder="Full Name"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Contact Phone</label>
                <input
                  type="tel"
                  name="contactPersonPhone"
                  value={formData.contactPersonPhone ?? ""}
                  onChange={handleInputChange}
                  placeholder="Phone Number"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Contact Email</label>
                <input
                  type="email"
                  name="contactPersonEmail"
                  value={formData.contactPersonEmail ?? ""}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">HR Contact Person</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">HR Person Name</label>
                <input
                  type="text"
                  name="hr_PersonName"
                  value={formData.hr_PersonName ?? ""}
                  onChange={handleInputChange}
                  placeholder="Full Name"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">HR Person Email</label>
                <input
                  type="email"
                  name="hr_PersonEmail"
                  value={formData.hr_PersonEmail ?? ""}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={formData.notes ?? ""}
              onChange={handleInputChange}
              placeholder="Additional notes..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="erp-kpi-action-footer border-t border-slate-100 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="erp-action-btn erp-action-btn-primary disabled:opacity-50"
            >
              {editingId ? "Update Company" : "Create Company"}
            </button>
            <button
              onClick={handleCancel}
              className="erp-action-btn erp-action-btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <QuickEditDrawer
        open={Boolean(quickEditCompany)}
        title="Quick Edit Company"
        subtitle="Fast rename/code/city/status updates"
        onClose={closeQuickEdit}
        onSave={() => void handleQuickEditSave()}
        saveLabel="Update Company"
        saving={quickEditSaving}
      >
        <div>
          <label className="erp-label">Company Name *</label>
          <input
            type="text"
            value={quickEditForm.name}
            onChange={(event) => setQuickEditForm((prev) => ({ ...prev, name: event.target.value }))}
            className="erp-input"
            placeholder="Enter company name"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="erp-label">Company Code</label>
            <input
              type="text"
              value={quickEditForm.code}
              onChange={(event) => setQuickEditForm((prev) => ({ ...prev, code: event.target.value }))}
              className="erp-input"
              placeholder="COMP001"
            />
          </div>
          <div>
            <label className="erp-label">City</label>
            <input
              type="text"
              value={quickEditForm.city}
              onChange={(event) => setQuickEditForm((prev) => ({ ...prev, city: event.target.value }))}
              className="erp-input"
              placeholder="Bengaluru"
            />
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={quickEditForm.isActive}
              onChange={(event) => setQuickEditForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300"
            />
            Active company
          </label>
        </div>
      </QuickEditDrawer>
    </StandardPageLayout>
  );
}
