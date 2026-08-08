"use client";

import { useEffect, useState } from "react";
import { Trash2, RotateCcw, RefreshCw, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { hrApi } from "@/services/hrApi";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { GlobalLoading } from "@/components/ui/GlobalLoading";

export interface DeletedItem {
  id: string;
  entityName: string;
  entityId?: string;
  name?: string;
  deletedBy?: string;
  performedAt?: string;
  ip?: string;
}

export function RecycleBinManager() {
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { confirm, confirmDialog } = useConfirmDialog();

  const fetchDeleted = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await hrApi.platform.recycleBin.listDeleted({ limit: 100 });
      const logs = (res.data?.logs as DeletedItem[]) || (res.data as DeletedItem[]) || [];
      setItems(logs);
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load deleted records");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeleted();
  }, []);

  const handleRestore = async (entityName: string, entityId: string) => {
    try {
      await hrApi.platform.recycleBin.restore(entityName, entityId);
      notifySuccess(`Restored ${entityName} record successfully.`);
      fetchDeleted();
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to restore record");
      notifyError(message);
    }
  };

  const handleHardDelete = async (entityName: string, entityId: string) => {
    const ok = await confirm({
      title: "Permanently Delete Record",
      message: `Are you sure you want to permanently delete this ${entityName}? This action cannot be undone.`,
      confirmText: "Permanently Delete",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await hrApi.platform.recycleBin.hardDelete(entityName, entityId);
      notifySuccess(`Permanently deleted ${entityName}.`);
      fetchDeleted();
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to permanently delete record");
      notifyError(message);
    }
  };

  return (
    <div className="space-y-6">
      {confirmDialog}
      <PageHeader
        title="Recycle Bin & Data Recovery"
        subtitle="Restore soft-deleted records or permanently purge expired entity items across the platform."
        breadcrumbs={[
          { label: "Platform", href: "/platform/settings" },
          { label: "Recycle Bin" },
        ]}
        actions={
          <Button size="sm" variant="outline" onClick={fetchDeleted} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh Log
          </Button>
        }
      />

      {error && (
        <div className="p-3 text-xs bg-rose-50 text-rose-800 rounded-xl border border-rose-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <GlobalLoading label="Loading deleted items from database..." variant="inline" />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                      {item.name || item.entityId || item.id}
                    </span>
                    <span className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {item.entityName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Deleted by: <span className="font-medium text-slate-800 dark:text-slate-200">{item.deletedBy || "System Admin"}</span>
                    {item.performedAt ? ` • Date: ${new Date(item.performedAt).toLocaleDateString()}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.entityId && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        onClick={() => handleRestore(item.entityName, item.entityId!)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        onClick={() => handleHardDelete(item.entityName, item.entityId!)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Purge
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {items.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500 italic rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              Recycle Bin is empty. No deleted records found in the database.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
