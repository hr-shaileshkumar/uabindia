"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";

import { useMemo, useState } from "react";
import { HardDrive, RotateCcw, ShieldAlert, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdministrationGlobalPageShell, KpiMetricItem } from "@/components/administration/AdministrationGlobalPageShell";
import { ErpRowActions } from "@/components/workspace/page-kit";
import { erpButtonClassName } from "@/components/workspace/styles";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { mapRecycleBinLog, useRecycleBin, useRecycleBinMutations } from "@/features/administration/hooks/useRecycleBin";

type RecycleRow = ReturnType<typeof mapRecycleBinLog>;

function LegacyRecycleBinPage() {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const { data, isLoading, isError, error, refetch } = useRecycleBin(1, 50, entityFilter !== "all" ? entityFilter : undefined);
  const { restore, hardDelete } = useRecycleBinMutations();

  const items = useMemo(() => (data?.logs ?? []).map(mapRecycleBinLog), [data?.logs]);

  const handleRestore = async (row: RecycleRow) => {
    if (!row.entityId) {
      notifyError("Cannot restore: missing entity identifier.");
      return;
    }
    try {
      await restore.mutateAsync({ entityName: row.entityType, entityId: row.entityId });
      notifySuccess(`Restored "${row.displayName}" successfully.`);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to restore record."));
    }
  };

  const handleHardDelete = async (row: RecycleRow) => {
    if (!row.entityId) {
      notifyError("Cannot purge: missing entity identifier.");
      return;
    }
    try {
      await hardDelete.mutateAsync({ entityName: row.entityType, entityId: row.entityId });
      notifySuccess(`Permanently deleted "${row.displayName}".`);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to permanently delete record."));
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const q = search.toLowerCase();
      return !q || i.displayName.toLowerCase().includes(q) || i.entityType.toLowerCase().includes(q);
    });
  }, [items, search]);

  const kpis: KpiMetricItem[] = [
    { label: "Soft-Deleted Items", value: data?.total ?? items.length, tone: "warning", icon: <HardDrive className="h-3.5 w-3.5" />, subtext: "Live API" },
    { label: "Entity Types", value: new Set(items.map((i) => i.entityType)).size, tone: "info", icon: <Layers className="h-3.5 w-3.5" />, subtext: "Entities" },
    { label: "Purge Window", value: "30 Days", tone: "positive", icon: <ShieldAlert className="h-3.5 w-3.5" />, subtext: "Retention" },
    { label: "SuperAdmin Only", value: "Required", tone: "warning", icon: <RotateCcw className="h-3.5 w-3.5" />, subtext: "Access" },
  ];

  return (
    <AdministrationGlobalPageShell
      title="Recycle Bin & Record Recovery Center"
      subtitle="Unified soft-deleted record directory. Restore misplaced records or execute permanent database purges."
      categoryTag="Data Protection & Purge Policy"
      kpiMetrics={kpis}
      searchPlaceholder="Filter record name or entity type..."
      searchValue={search}
      onSearchChange={setSearch}
      filterOptions={[
        {
          key: "entity",
          label: "All Entity Types",
          value: entityFilter,
          onChange: setEntityFilter,
          options: [
            { label: "All Entity Types", value: "all" },
            { label: "User", value: "User" },
            { label: "Tenant", value: "Tenant" },
            { label: "Company", value: "Company" },
          ],
        },
      ]}
      onClearFilters={() => {
        setSearch("");
        setEntityFilter("all");
      }}
      onRefresh={() => void refetch()}
      isLoading={isLoading}
      listKey="platform-recycle-bin"
      listRows={filteredItems}
      getRowId={(row) => row.id}
      emptyMessage={
        isError
          ? getApiErrorMessage(error, "Failed to load recycle bin. SuperAdmin access is required.")
          : "Recycle bin is clear. No soft-deleted records."
      }
      listColumns={[
        { key: "entityType", label: "Entity Type", dataType: "string" },
        { key: "displayName", label: "Record Display Name / Key", dataType: "string" },
        { key: "deletedBy", label: "Deleted By", dataType: "string" },
        { key: "deletedAt", label: "Deletion Date", dataType: "date" },
        { key: "retentionDaysLeft", label: "Retention Left", dataType: "number" },
        { key: "actions", label: "Actions", locked: true },
      ]}
      renderListRow={(row) => (
        <>
          <td className="erp-td">
            <Badge variant="outline" className="text-xs font-normal">
              {row.entityType}
            </Badge>
          </td>
          <td className="erp-td font-semibold text-xs">{row.displayName}</td>
          <td className="erp-td font-mono text-xs text-muted-foreground">{row.deletedBy || "System"}</td>
          <td className="erp-td text-xs text-muted-foreground">{row.deletedAt}</td>
          <td className="erp-td">
            <span className="erp-chip erp-chip-warning font-mono">{row.retentionDaysLeft} Days</span>
          </td>
          <td className="erp-td">
            <ErpRowActions
              extra={
                <button
                  type="button"
                  title="Restore"
                  disabled={restore.isPending || !row.entityId}
                  onClick={() => void handleRestore(row)}
                  className={`${erpButtonClassName.secondary} h-8 px-2 text-xs text-emerald-600`}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1 inline" />
                  Restore
                </button>
              }
              onDelete={{
                label: "Permanently delete",
                disabled: hardDelete.isPending || !row.entityId,
                onClick: () => void handleHardDelete(row),
              }}
            />
          </td>
        </>
      )}
    />
  );
}

export default function RecycleBinPage() {
  return (
    <DynamicPage
      pageKey="administration.recycle-bin"
      fallback={<LegacyRecycleBinPage />}
      renderMode="auto"
    />
  );
}
