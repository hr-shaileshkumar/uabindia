"use client";

import React, { useMemo, useState } from "react";
import { HardDrive, RotateCcw, Trash2, ShieldAlert, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { mapRecycleBinLog, useRecycleBin, useRecycleBinMutations } from "@/features/platform/hooks/useRecycleBin";

type RecycleRow = ReturnType<typeof mapRecycleBinLog>;

export default function RecycleBinPage() {
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
    <PlatformGlobalPageShell
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
    >
      {isError && (
        <p className="px-4 py-3 text-xs text-rose-600 border-b border-[var(--border-subtle)]">
          {getApiErrorMessage(error, "Failed to load recycle bin. SuperAdmin access is required.")}
        </p>
      )}
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Entity Type</th>
              <th className="erp-th">Record Display Name / Key</th>
              <th className="erp-th">Deleted By</th>
              <th className="erp-th">Deletion Date</th>
              <th className="erp-th">Retention Left</th>
              <th className="erp-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="erp-td text-center text-xs text-muted-foreground py-8">
                  Loading recycle bin…
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="erp-td py-12 text-center text-xs text-muted-foreground">
                  Recycle bin is clear. No soft-deleted records.
                </td>
              </tr>
            ) : (
              filteredItems.map((row) => (
                <tr key={row.id} className="erp-tr hover:bg-[var(--bg-muted)]/60 transition-colors">
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
                  <td className="erp-td text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs text-emerald-600"
                        disabled={restore.isPending || !row.entityId}
                        onClick={() => void handleRestore(row)}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Restore
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-rose-600"
                        disabled={hardDelete.isPending || !row.entityId}
                        onClick={() => void handleHardDelete(row)}
                      >
                        <Trash2 className="h-4 w-4" />
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
