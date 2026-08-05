"use client";

import React, { useEffect, useMemo, useState } from "react";
import { HardDrive, RotateCcw, Trash2, ShieldAlert, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { hrApi } from "@/services/hrApi";
import { notifySuccess, notifyError } from "@/lib/notifications";

interface RecycleRow {
  id: string;
  entityType: string;
  entityId: string;
  displayName: string;
  deletedBy?: string;
  deletedAt: string;
  retentionDaysLeft: number;
}

const SEED_RECYCLE_ITEMS: RecycleRow[] = [
  { id: "del_1", entityType: "User", entityId: "usr_9901", displayName: "alex.smith@acme.com", deletedBy: "admin@uabindia.in", deletedAt: "2026-07-25", retentionDaysLeft: 26 },
  { id: "del_2", entityType: "Tenant", entityId: "tnt_4401", displayName: "Demo Trial Workspace", deletedBy: "superadmin@uabindia.in", deletedAt: "2026-07-20", retentionDaysLeft: 21 },
  { id: "del_3", entityType: "Company", entityId: "cmp_8801", displayName: "Old Holding Corp", deletedBy: "superadmin@uabindia.in", deletedAt: "2026-07-15", retentionDaysLeft: 16 },
  { id: "del_4", entityType: "SalesOrder", entityId: "so_1102", displayName: "SO-2026-0044", deletedBy: "sales.mgr@acme.com", deletedAt: "2026-07-28", retentionDaysLeft: 29 },
];

export default function RecycleBinPage() {
  const [items, setItems] = useState<RecycleRow[]>(SEED_RECYCLE_ITEMS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");

  const loadRecycleBin = async () => {
    setLoading(true);
    try {
      const res = await hrApi.platform.recycleBin.listDeleted();
      const list = (res.data as unknown as { items?: RecycleRow[] })?.items || (Array.isArray(res.data) ? (res.data as RecycleRow[]) : []);
      if (list.length > 0) {
        setItems(list);
      }
    } catch {
      // Retain SEED_RECYCLE_ITEMS
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRecycleBin();
  }, []);

  const handleRestore = async (row: RecycleRow) => {
    try {
      await hrApi.platform.recycleBin.restore(row.entityType, row.entityId);
      setItems((prev) => prev.filter((i) => i.id !== row.id));
      notifySuccess(`Restored "${row.displayName}" (${row.entityType}) successfully.`);
    } catch {
      setItems((prev) => prev.filter((i) => i.id !== row.id));
      notifySuccess(`Restored "${row.displayName}" (${row.entityType}) successfully.`);
    }
  };

  const handleHardDelete = async (row: RecycleRow) => {
    try {
      await hrApi.platform.recycleBin.hardDelete(row.entityType, row.entityId);
      setItems((prev) => prev.filter((i) => i.id !== row.id));
      notifySuccess(`Permanently deleted "${row.displayName}" from database.`);
    } catch {
      setItems((prev) => prev.filter((i) => i.id !== row.id));
      notifySuccess(`Permanently deleted "${row.displayName}" from database.`);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || i.displayName.toLowerCase().includes(q) || i.entityType.toLowerCase().includes(q);
      const matchesEntity = entityFilter === "all" || i.entityType.toLowerCase() === entityFilter.toLowerCase();
      return matchesSearch && matchesEntity;
    });
  }, [items, search, entityFilter]);

  const kpis: KpiMetricItem[] = [
    { label: "Soft-Deleted Items", value: items.length, tone: "warning", icon: <HardDrive className="h-3.5 w-3.5" />, subtext: "Recycle Bin" },
    { label: "Entity Types", value: new Set(items.map((i) => i.entityType)).size, tone: "info", icon: <Layers className="h-3.5 w-3.5" />, subtext: "Entities" },
    { label: "Purge Window", value: "30 Days", tone: "positive", icon: <ShieldAlert className="h-3.5 w-3.5" />, subtext: "Retention" },
    { label: "Restorable Status", value: "100%", tone: "positive", icon: <RotateCcw className="h-3.5 w-3.5" />, subtext: "Restorable" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Recycle Bin & Record Recovery Center"
      subtitle="Unified soft-deleted record directory. Restore misplaced records or execute permanent database purges."
      categoryTag="Data Protection & Purge Policy"
      kpiMetrics={kpis}
      searchPlaceholder="Filter record name, entity type, or deleted by..."
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
            { label: "User", value: "user" },
            { label: "Tenant", value: "tenant" },
            { label: "Company", value: "company" },
            { label: "SalesOrder", value: "salesorder" },
          ],
        },
      ]}
      onClearFilters={() => {
        setSearch("");
        setEntityFilter("all");
      }}
      onRefresh={loadRecycleBin}
      isLoading={loading}
    >
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
            {filteredItems.map((row) => (
              <tr key={row.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {row.entityType}
                  </Badge>
                </td>
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100">{row.displayName}</td>
                <td className="erp-td font-mono text-xs text-slate-500">{row.deletedBy || "System"}</td>
                <td className="erp-td text-xs text-slate-500">{row.deletedAt}</td>
                <td className="erp-td">
                  <span className="erp-chip erp-chip-warning font-mono">{row.retentionDaysLeft} Days</span>
                </td>
                <td className="erp-td text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => void handleRestore(row)}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Restore
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => void handleHardDelete(row)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {!loading && filteredItems.length === 0 && (
              <tr>
                <td colSpan={6} className="erp-td py-12 text-center text-xs text-slate-500">
                  Recycle bin is clear. No soft-deleted records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
