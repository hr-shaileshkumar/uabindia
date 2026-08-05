"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/design-system";
import { useAuth } from "@/context/AuthContext";
import { hrApi } from "@/services/hrApi";
import { useOrgContext } from "@/context/OrgContext";
import { getApiErrorMessage } from "@/lib/api-errors";
import { isSuperAdminRole } from "@/lib/auth/role-utils";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { useCompanies, useCompanyMutations, useTenants } from "@/features/companies/hooks";
import type { CompanyMutationPayload, CompanyRecord, TenantSummary } from "@/features/companies/types";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

import { DataTable } from "./data-table";
import { getColumns } from "./columns";
import { CompanyDrawerForm } from "./company-drawer-form";
import { BulkCompanyImportDialog } from "./bulk-company-import-dialog";

const PAGE_SIZE = 100;
const EMPTY_COMPANIES: CompanyRecord[] = [];
const EMPTY_TENANTS: TenantSummary[] = [];

const getCurrentSubdomain = () => {
  if (typeof window === "undefined") return "";
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.endsWith(".localhost") && hostname !== "localhost" && hostname !== "127.0.0.1") {
    return hostname.split(".")[0] || "";
  }
  return "";
};

export default function CompaniesPage() {
  const { confirm, confirmDialog } = useConfirmDialog();
  const { user } = useAuth();
  const { companyId: ctxCompanyId } = useOrgContext();
  
  const roles = (user as { roles?: string[] } | null)?.roles || [];
  const isSuperAdmin = roles.some((role) => isSuperAdminRole(role));
  const currentPage = 1;

  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [tenantFilterSubdomain, setTenantFilterSubdomain] = useState<string | undefined>(undefined);
  const [showDeleted, setShowDeleted] = useState(false);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyRecord | null>(null);
  const [importOpen, setImportOpen] = useState(false);

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

    if (ctxCompanyId) {
      return visibilityFiltered.filter((company) => company.id === ctxCompanyId);
    }
    return visibilityFiltered;
  }, [companies, showDeleted, ctxCompanyId]);

  const loading = companiesQuery.isLoading;
  const saving = createCompanyMutation.isPending || updateCompanyMutation.isPending;

  useEffect(() => {
    if (!isSuperAdmin || selectedTenantId || tenants.length === 0) return;
    const currentSubdomain = getCurrentSubdomain();
    if (!currentSubdomain) return;
    const matchingTenant = tenants.find((tenant) => tenant.subdomain === currentSubdomain);
    if (matchingTenant?.id) {
      setSelectedTenantId(matchingTenant.id);
    }
  }, [isSuperAdmin, selectedTenantId, tenants]);

  useEffect(() => {
    if (!isSuperAdmin || tenants.length === 0) return;
    if (!selectedTenantId) {
      setTenantFilterSubdomain(undefined);
      return;
    }
    const selected = tenants.find((tenant) => tenant.id === selectedTenantId);
    setTenantFilterSubdomain(selected?.subdomain);
  }, [isSuperAdmin, selectedTenantId, tenants]);

  // Handlers
  const handleOpenCreate = () => {
    setEditingCompany(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (company: CompanyRecord) => {
    setEditingCompany(company);
    setDrawerOpen(true);
  };

  const handleDelete = async (company: CompanyRecord) => {
    const ok = await confirm({
      title: "Delete company",
      message: `Delete company "${company.name}"? It will move to deleted records.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await deleteCompanyMutation.mutateAsync(company.id);
      notifySuccess("Company deleted successfully.");
    } catch (error) {
      notifyError(getApiErrorMessage(error, "Failed to delete company"));
    }
  };

  const handleRestore = async (company: CompanyRecord) => {
    try {
      await hrApi.platform.recycleBin.restore("Companies", company.id);
      notifySuccess("Company restored successfully.");
      await companiesQuery.refetch();
    } catch (error) {
      notifyError(getApiErrorMessage(error, "Failed to restore company"));
    }
  };

  const handleBulkDelete = async (selectedCompanies: CompanyRecord[]) => {
    const count = selectedCompanies.length;
    if (count === 0) return;

    const ok = await confirm({
      title: "Delete selected companies",
      message: `Delete ${count} selected company${count === 1 ? "" : "s"}?`,
      confirmText: "Delete All",
      variant: "danger",
    });
    if (!ok) return;

    let successCount = 0;
    for (const company of selectedCompanies) {
      try { 
        await deleteCompanyMutation.mutateAsync(company.id); 
        successCount++; 
      } catch { /* ignore */ }
    }
    notifySuccess(`Deleted ${successCount} of ${count} company${count === 1 ? "" : "s"}.`);
    await companiesQuery.refetch();
  };

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      const payload: CompanyMutationPayload = {
        name: data.name as string,
        legalName: (data.legalName as string) || undefined,
        code: (data.code as string) || undefined,
        city: (data.city as string) || undefined,
        email: (data.email as string) || undefined,
        isActive: data.isActive as boolean,
      };

      if (editingCompany) {
        await updateCompanyMutation.mutateAsync({ id: editingCompany.id, payload });
        notifySuccess("Company updated successfully.");
      } else {
        const selectedTenant = tenants.find((tenant) => tenant.id === data.tenantId);
        await createCompanyMutation.mutateAsync({
          payload,
          tenant: selectedTenant?.subdomain,
        });
        if (data.tenantId) {
          setTenantFilterSubdomain(selectedTenant?.subdomain);
          setSelectedTenantId(data.tenantId as string);
        }
        await companiesQuery.refetch();
        notifySuccess("Company created successfully.");
      }
      setDrawerOpen(false);
    } catch (error) {
      notifyError(getApiErrorMessage(error, "Failed to save company"));
    }
  };

  const handleExport = () => {
    if (filteredCompanies.length === 0) return;
    const headers = ["ID", "Name", "LegalName", "Code", "City", "Email", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredCompanies.map((c) =>
        [c.id, `"${c.name}"`, `"${c.legalName || ""}"`, c.code || "", c.city || "", c.email || "", c.isActive ? "Active" : "Inactive"].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "companies_export.csv";
    link.click();
  };

  const columns = useMemo(
    () =>
      getColumns({
        onEdit: handleOpenEdit,
        onQuickEdit: handleOpenEdit,
        onDelete: handleDelete,
        onRestore: handleRestore,
        isSuperAdmin,
      }),
    [isSuperAdmin, deleteCompanyMutation] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div className="erp-page space-y-5">
      {confirmDialog}

      {/* Centralized Design System Page Header */}
      <PageHeader
        title="Company Master"
        subtitle="Manage company details, legal registration names, tenant linkage, and organization structure."
        eyebrow="Administration / Master Data"
        icon="building"
        stats={[
          { label: "Companies", value: companies.length },
          { label: "Active", value: companies.filter((c) => c.isActive).length, tone: "success" },
          { label: "Inactive", value: companies.filter((c) => !c.isActive).length, tone: "warning" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {isSuperAdmin && (
              <select
                value={tenantFilterSubdomain || ""}
                onChange={(e) => setTenantFilterSubdomain(e.target.value || undefined)}
                className="h-9 w-48 rounded-lg border border-slate-300 dark:border-slate-700 bg-background px-3 py-1 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Filter companies by tenant"
              >
                <option value="">All Tenant Registries</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.subdomain}>
                    {tenant.name} ({tenant.subdomain})
                  </option>
                ))}
              </select>
            )}

            <Button onClick={handleOpenCreate} className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-4 shadow-sm">
              <Plus className="mr-1.5 h-4 w-4" />
              New Company
            </Button>
          </div>
        }
      />

      {/* Data Table Workspace */}
      <div className="px-0.5">
        <DataTable
          columns={columns}
          data={filteredCompanies}
          loading={loading}
          isSuperAdmin={isSuperAdmin}
          showDeleted={showDeleted}
          onToggleDeleted={() => setShowDeleted((prev) => !prev)}
          onCreate={undefined} // Handled cleanly in Header CTA to avoid duplicate buttons
          onBulkDelete={handleBulkDelete}
          onExport={handleExport}
          onImport={() => setImportOpen(true)}
          searchKey="name"
        />
      </div>

      <CompanyDrawerForm
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        company={editingCompany}
        tenants={tenants}
        isSuperAdmin={isSuperAdmin}
        selectedTenantId={selectedTenantId}
        onSubmit={handleFormSubmit}
        saving={saving}
      />

      <BulkCompanyImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImportComplete={() => companiesQuery.refetch()}
      />
    </div>
  );
}
