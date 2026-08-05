"use client";

import React, { useState } from "react";
import { useTenants, useDeleteTenant, useRestoreTenant, useBulkTenantAction } from "../hooks/useTenants";
import { useTenantStore } from "../store/tenantStore";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { BulkActionBar } from "@/components/table/BulkActionBar";
import { BulkTenantImportDialog } from "./dialogs/BulkTenantImportDialog";
import { TenantEditDrawer } from "./dialogs/TenantEditDrawer";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { getPlatformBaseDomain } from "@/lib/tenant-host";
import { StatusBadge } from "@/components/erp/status-badge";
import { Search, Download, Upload, Plus, Globe, Shield, User, Users } from "lucide-react";
import type { Tenant } from "../types";

export function TenantListTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [importOpen, setImportOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const { data: paginatedData, isLoading, error, refetch } = useTenants({
    search: search || undefined,
    status: status !== "all" ? status : undefined,
  });

  const deleteMutation = useDeleteTenant();
  const restoreMutation = useRestoreTenant();
  const bulkActionMutation = useBulkTenantAction();
  
  const { selectedTenantIds, toggleSelection, selectAll, clearSelection } = useTenantStore();
  const baseDomain = getPlatformBaseDomain();

  const handleOpenEdit = (t: Tenant) => {
    setEditingTenant(t);
    setEditDrawerOpen(true);
  };

  const handleExport = () => {
    if (!paginatedData?.data) return;
    const headers = ["ID", "Name", "Subdomain", "Status", "Plan", "Users", "AdminName", "AdminEmail", "CreatedAt"];
    const csvContent = [
      headers.join(","),
      ...paginatedData.data.map((t) =>
        [
          t.id, 
          `"${t.name}"`, 
          t.subdomain, 
          t.status, 
          t.subscriptionPlan, 
          t.usersCount, 
          `"${t.adminName}"`, 
          t.adminEmail, 
          t.createdAt
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "tenants_export.csv";
    link.click();
  };

  const handleBulkDelete = async () => {
    if (selectedTenantIds.length === 0) return;
    try {
      await bulkActionMutation.mutateAsync({
        tenantIds: selectedTenantIds,
        action: "delete",
      });
      notifySuccess("Selected tenants deleted successfully.");
      clearSelection();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete selected tenants"));
    }
  };

  const handleBulkRestore = async () => {
    if (selectedTenantIds.length === 0) return;
    try {
      await bulkActionMutation.mutateAsync({
        tenantIds: selectedTenantIds,
        action: "restore",
      });
      notifySuccess("Selected tenants restored successfully.");
      clearSelection();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to restore selected tenants"));
    }
  };

  if (isLoading) return <div className="p-12 text-center text-slate-500 font-medium">Loading tenants...</div>;
  if (error) return <div className="p-12 text-center text-red-500 font-medium">Failed to load tenants.</div>;

  const tenants = paginatedData?.data || [];
  const allSelected = tenants.length > 0 && selectedTenantIds.length === tenants.length;

  return (
    <div className="space-y-4">
      {/* Bulk Action Bar */}
      {selectedTenantIds.length > 0 && (
        <BulkActionBar
          selectionCount={selectedTenantIds.length}
          onDelete={handleBulkDelete}
          onRestore={handleBulkRestore}
          onClear={clearSelection}
          loading={bulkActionMutation.isPending}
        />
      )}

      {/* Enterprise Filter & Actions Toolbar */}
      <div className="erp-table-toolbar flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-t-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tenants or subdomains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-3 w-64 rounded-md border border-slate-300 dark:border-slate-700 bg-background text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-background px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="trial">Trialing</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="h-9">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="h-9">
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Bulk Import
          </Button>
        </div>
      </div>

      {/* Main ERP Data Table */}
      <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-b-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <table className="erp-table min-w-full text-sm text-left">
          <thead className="erp-thead bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-4 py-3 w-12 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) =>
                    e.target.checked ? selectAll(tenants.map((t) => t.id)) : clearSelection()
                  }
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Tenant Name</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Domain Host</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Admin Contact</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Users</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Plan</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Provisioned</th>
              <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={selectedTenantIds.includes(tenant.id)}
                    onChange={() => toggleSelection(tenant.id)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                  <Link href={`${ROUTES.PLATFORM_TENANTS}/${tenant.id}`} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                    {tenant.name}
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-mono text-xs">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Globe className="h-3 w-3 text-indigo-500" />
                    {tenant.subdomain}.{baseDomain}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-col text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-400" />
                      {tenant.adminName || "System Admin"}
                    </span>
                    <span className="text-slate-500 pl-4">{tenant.adminEmail}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    {tenant.usersCount || 0}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge 
                    tone={
                      tenant.status === "active" ? "positive" : tenant.status === "suspended" ? "critical" : "warning"
                    }
                  >
                    {tenant.status}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-medium">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                    <Shield className="h-3 w-3 text-indigo-500" />
                    {tenant.subscriptionPlan}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                  {new Date(tenant.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td className="px-4 py-3.5 text-right space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(tenant)} className="h-8 px-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                    Edit
                  </Button>
                  <Link href={`${ROUTES.PLATFORM_TENANTS}/${tenant.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600">
                      Manage
                    </Button>
                  </Link>
                  {tenant.isDeleted ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => restoreMutation.mutate(tenant.id)}
                      className="h-8 px-2 text-emerald-600 hover:text-emerald-700"
                    >
                      Restore
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(tenant.id)}
                      className="h-8 px-2 text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                  No tenants matching search criteria found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2 text-sm text-slate-500 dark:text-slate-400">
        <p>
          Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{tenants.length}</span> of <span className="font-semibold text-slate-700 dark:text-slate-200">{paginatedData?.totalCount || tenants.length}</span> tenants
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled className="h-8">Previous</Button>
          <Button variant="outline" size="sm" disabled={tenants.length < 50} className="h-8">Next</Button>
        </div>
      </div>

      <BulkTenantImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImportComplete={refetch}
      />

      <TenantEditDrawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        tenant={editingTenant}
        onSuccess={refetch}
      />
    </div>
  );
}

