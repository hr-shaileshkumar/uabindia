"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  AlertTriangle,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Upload,
  Columns3,
} from "lucide-react";
import { AdministrationGlobalPageShell } from "@/components/administration/AdministrationGlobalPageShell";
import { ErpRowActions } from "@/components/workspace/page-kit";
import { UniversalDeleteDialog } from "@/components/workspace/templates/UniversalDeleteDialog";
import { UniversalBulkImportModal } from "@/components/workspace/UniversalBulkImportModal";
import { DynamicForm } from "./DynamicForm";
import { renderDynamicTableCell } from "./DynamicFieldRegistry";
import { platformApi } from "@/services/modules/administration";
import apiClient from "@/services/apiClient";
import { usePermissions } from "@/context/PermissionContext";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import type { DynamicPageSchema } from "@/lib/dynamic-schema/types";

interface DynamicPageProps {
  pageKey: string;
  fallback?: React.ReactNode;
  renderMode?: "auto" | "dynamic" | "legacy";
  initialSchema?: DynamicPageSchema;
  previewMode?: boolean;
  companyId?: string;
  projectId?: string;
}

const KPI_ICONS: Record<string, React.ReactNode> = {
  Users: <Users className="h-3.5 w-3.5" />,
  CheckCircle2: <CheckCircle2 className="h-3.5 w-3.5" />,
  Clock: <Clock className="h-3.5 w-3.5" />,
  Briefcase: <Briefcase className="h-3.5 w-3.5" />,
  Layers: <Layers className="h-3.5 w-3.5" />,
};

export function DynamicPage({
  pageKey,
  fallback,
  renderMode = "auto",
  initialSchema,
  previewMode = false,
  companyId,
  projectId,
}: DynamicPageProps) {
  const router = useRouter();
  const { hasPermission, isSuperAdmin } = usePermissions();

  // Schema state
  const [schema, setSchema] = useState<DynamicPageSchema | null>(initialSchema || null);
  const [schemaLoading, setSchemaLoading] = useState(!initialSchema);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  // Data state
  const [records, setRecords] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // Drawer / Form state
  const [drawerMode, setDrawerMode] = useState<"closed" | "create" | "edit">("closed");
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Import and Column Visibility state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<string[]>([]);

  // Load Page Schema (resolving company/project scope from backend)
  const loadSchema = useCallback(async () => {
    if (initialSchema) {
      setSchema(initialSchema);
      setSchemaLoading(false);
      return;
    }
    if (renderMode === "legacy") {
      setSchemaLoading(false);
      return;
    }

    try {
      setSchemaLoading(true);
      setSchemaError(null);
      const res = await platformApi.uiPages.get(pageKey, {
        draft: previewMode,
        companyId,
        projectId,
      });
      const raw = res.data;
      if (raw && raw.schemaJson) {
        const parsed: DynamicPageSchema =
          typeof raw.schemaJson === "string" ? JSON.parse(raw.schemaJson) : raw.schemaJson;
        setSchema(parsed);
      } else {
        setSchema(null);
      }
    } catch (err) {
      setSchema(null);
      setSchemaError(getApiErrorMessage(err, "Page schema not found."));
    } finally {
      setSchemaLoading(false);
    }
  }, [pageKey, initialSchema, renderMode, previewMode, companyId, projectId]);

  useEffect(() => {
    void loadSchema();
  }, [loadSchema]);

  // Fetch entity data
  const fetchData = useCallback(async () => {
    if (!schema?.apiEndpoint) return;
    try {
      setLoadingData(true);
      setDataError(null);
      const res = await apiClient.get(schema.apiEndpoint);
      const raw = res.data;
      const list: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.items)
        ? raw.items
        : Array.isArray(raw?.employees)
        ? raw.employees
        : Array.isArray(raw?.data)
        ? raw.data
        : [];
      setRecords(list);
    } catch (err) {
      setDataError(getApiErrorMessage(err, "Failed to load data."));
    } finally {
      setLoadingData(false);
    }
  }, [schema?.apiEndpoint]);

  useEffect(() => {
    if (schema) {
      void fetchData();
    }
  }, [schema, fetchData]);

  const visibleColumns = useMemo(() => {
    if (!schema?.columns) return [];
    return (schema.columns || [])
      .filter((c) => !c.hidden && !hiddenColumnKeys.includes(c.key))
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [schema?.columns, hiddenColumnKeys]);

  // Fallback to legacy page if in legacy mode or schema missing
  if (!schemaLoading && !schema && fallback) {
    return <>{fallback}</>;
  }

  // Schema Loading State
  if (schemaLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-center">
        <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold text-slate-500">Loading dynamic page schema…</p>
      </div>
    );
  }

  // Schema Error State (Graceful failure)
  if (!schema && schemaError) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="mx-auto my-12 max-w-lg rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-xs">
        <AlertTriangle className="mx-auto h-10 w-10 text-rose-500" />
        <h3 className="mt-3 text-sm font-bold text-slate-900">Unable to load page configuration</h3>
        <p className="mt-1 text-xs text-slate-500">{schemaError}</p>
        <p className="mt-3 text-[11px] font-mono text-slate-400">Page Key: {pageKey}</p>
        <button
          type="button"
          onClick={() => void loadSchema()}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  if (!schema) return null;

  // Filter and search records
  const filteredRecords = records.filter((rec) => {
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchesSearch = Object.values(rec).some(
        (val) => typeof val === "string" && val.toLowerCase().includes(q)
      );
      if (!matchesSearch) return false;
    }

    for (const [key, val] of Object.entries(filterValues)) {
      if (val && val !== "all") {
        if (String(rec[key] ?? "").toLowerCase() !== val.toLowerCase()) {
          return false;
        }
      }
    }
    return true;
  });

  // Calculate dynamic KPIs
  const kpis = (schema.kpiMetrics || []).map((kpi) => {
    let computedVal = kpi.value;
    if (computedVal === undefined) {
      if (kpi.label.toLowerCase().includes("total")) {
        computedVal = records.length;
      } else if (kpi.label.toLowerCase().includes("active")) {
        computedVal = records.filter((r) => String(r.status ?? r.isActive).toLowerCase() === "active" || r.isActive === true).length;
      } else {
        computedVal = records.length;
      }
    }
    return {
      label: kpi.label,
      value: computedVal,
      tone: kpi.tone || ("info" as const),
      icon: kpi.icon && KPI_ICONS[kpi.icon] ? KPI_ICONS[kpi.icon] : <Layers className="h-3.5 w-3.5" />,
      subtext: kpi.subtext,
    };
  });

  // Permissions check
  const canCreate =
    isSuperAdmin ||
    !schema.actions?.find((a) => a.key === "create")?.requiredPermission ||
    hasPermission([schema.actions.find((a) => a.key === "create")!.requiredPermission!]);

  const canEdit =
    isSuperAdmin ||
    !schema.actions?.find((a) => a.key === "edit")?.requiredPermission ||
    hasPermission([schema.actions.find((a) => a.key === "edit")!.requiredPermission!]);

  const canDelete =
    isSuperAdmin ||
    !schema.actions?.find((a) => a.key === "delete")?.requiredPermission ||
    hasPermission([schema.actions.find((a) => a.key === "delete")!.requiredPermission!]);

  // Form Save Handler
  const handleSaveForm = async (formData: Record<string, any>) => {
    try {
      setIsSaving(true);
      const idKey = schema.idField || "id";
      if (drawerMode === "edit" && editingRecord) {
        const id = editingRecord[idKey] || editingRecord.id;
        await apiClient.put(`${schema.apiEndpoint}/${id}`, formData);
        notifySuccess(`${schema.title} record updated successfully.`);
      } else {
        await apiClient.post(schema.apiEndpoint, formData);
        notifySuccess(`New ${schema.title} record created successfully.`);
      }
      setDrawerMode("closed");
      await fetchData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save record."));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const idKey = schema.idField || "id";
      const id = deleteTarget[idKey] || deleteTarget.id;
      await apiClient.delete(`${schema.apiEndpoint}/${id}`);
      notifySuccess("Record deleted successfully.");
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete record."));
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    if (filteredRecords.length === 0) {
      notifyError("No data to export.");
      return;
    }
    const cols = schema.columns.filter((c) => !c.hidden);
    const headers = cols.map((c) => `"${c.label}"`).join(",");
    const rows = filteredRecords.map((rec) =>
      cols.map((c) => `"${String(rec[c.key] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${schema.pageKey || "export"}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notifySuccess("CSV exported successfully.");
  };

  // Bulk Delete Handler
  const handleBulkDelete = async (selectedRows: any[]) => {
    if (!selectedRows || selectedRows.length === 0) return;
    try {
      setLoadingData(true);
      const idKey = schema?.idField || "id";
      for (const row of selectedRows) {
        const id = row[idKey] || row.id;
        if (id) {
          await apiClient.delete(`${schema.apiEndpoint}/${id}`);
        }
      }
      notifySuccess(`Deleted ${selectedRows.length} record(s).`);
      await fetchData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete selected records."));
    } finally {
      setLoadingData(false);
    }
  };

  // Export Selected Rows Handler
  const handleExportSelected = (selectedIds: string[]) => {
    const idKey = schema?.idField || "id";
    const selectedRecords = filteredRecords.filter((r) =>
      selectedIds.includes(String(r[idKey] || r.id))
    );
    if (selectedRecords.length === 0) {
      notifyError("No selected records to export.");
      return;
    }
    const cols = visibleColumns;
    const headers = cols.map((c) => `"${c.label}"`).join(",");
    const rows = selectedRecords.map((rec) =>
      cols.map((c) => `"${String(rec[c.key] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${schema.pageKey || "export"}_selected_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notifySuccess(`Exported ${selectedRecords.length} selected record(s).`);
  };

  return (
    <>
      <AdministrationGlobalPageShell
        title={schema.title}
        subtitle={schema.subTitle}
        categoryTag={schema.entityName}
        kpiMetrics={kpis}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={`Search ${schema.title}…`}
        filterOptions={(schema.filters || [])
          .filter((f) => f.filterType === "select" && f.options)
          .map((f) => ({
            key: f.key,
            label: f.label,
            value: filterValues[f.key] || "all",
            onChange: (val) => setFilterValues((prev) => ({ ...prev, [f.key]: val })),
            options: f.options || [],
          }))}
        onClearFilters={() => setFilterValues({})}
        primaryActionLabel={canCreate ? `New ${schema.entityName || "Record"}` : undefined}
        onPrimaryAction={
          canCreate
            ? () => {
                setEditingRecord(null);
                setDrawerMode("create");
              }
            : undefined
        }
        onRefresh={() => void fetchData()}
        onExportCsv={handleExportCsv}
        secondaryActions={[
          {
            label: "Import CSV",
            icon: <Upload className="h-3.5 w-3.5" />,
            onClick: () => setIsImportModalOpen(true),
          },
        ]}
        onBulkDelete={canDelete ? handleBulkDelete : undefined}
        bulkActions={[
          {
            key: "export-selected",
            label: "Export Selected CSV",
            onClick: (ids) => handleExportSelected(ids),
          },
        ]}
        isLoading={loadingData}
        listKey={`dynamic-page-${pageKey}`}
        listRows={filteredRecords}
        getRowId={(row) => String(row[schema.idField || "id"] || row.id || Math.random())}
        emptyMessage={`No ${schema.title} found. Click 'New ${schema.entityName || "Record"}' to create one.`}
        listColumns={[
          ...visibleColumns.map((c) => ({
            key: c.key,
            label: c.label,
            dataType: (c.dataType === "number" || c.dataType === "currency" ? "number" : "string") as any,
          })),
          { key: "actions", label: "Actions", locked: true },
        ]}
        renderListRow={(row) => (
          <>
            {visibleColumns.map((col) => (
              <td key={col.key} className="erp-td" style={col.width ? { width: col.width } : undefined}>
                {renderDynamicTableCell(col, row[col.key], row)}
              </td>
            ))}
            <td className="erp-td">
              <ErpRowActions
                onEdit={
                  canEdit
                    ? {
                        label: "Edit",
                        onClick: () => {
                          setEditingRecord(row);
                          setDrawerMode("edit");
                        },
                      }
                    : undefined
                }
                onDelete={
                  canDelete
                    ? {
                        label: "Delete",
                        onClick: () => setDeleteTarget(row),
                      }
                    : undefined
                }
              />
            </td>
          </>
        )}
        isInspectorOpen={drawerMode !== "closed"}
        onInspectorClose={() => setDrawerMode("closed")}
        inspectorTitle={drawerMode === "edit" ? `Edit ${schema.entityName}` : `New ${schema.entityName}`}
        inspectorSubTitle={schema.title}
        inspectorWidth="lg"
        inspectorContent={
          <DynamicForm
            sections={schema.form?.sections || []}
            initialData={editingRecord}
            isEdit={drawerMode === "edit"}
            isSaving={isSaving}
            onCancel={() => setDrawerMode("closed")}
            onSubmit={handleSaveForm}
          />
        }
      />

      <UniversalDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${schema.entityName}`}
        entityName={deleteTarget?.fullName || deleteTarget?.name || deleteTarget?.code || "Record"}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />

      <UniversalBulkImportModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        entityName={schema.entityName || "Record"}
        apiEndpoint={schema.apiEndpoint}
        fields={schema.columns.map((c) => ({
          key: c.key,
          label: c.label,
          required: schema.form?.sections?.some((s) => s.fields?.some((f) => f.key === c.key && f.required)),
        }))}
        onImportComplete={() => void fetchData()}
      />
    </>
  );
}
