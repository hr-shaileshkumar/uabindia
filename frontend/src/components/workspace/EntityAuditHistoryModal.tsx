"use client";

import React, { useEffect, useState } from "react";
import { History, Clock, User, Shield, ArrowRight, RefreshCw, X, AlertCircle, CheckCircle2, Copy } from "lucide-react";
import apiClient from "@/services/apiClient";
import { formatDateTime } from "@/lib/formatters";
import { notifySuccess, notifyError } from "@/lib/notifications";

export interface EntityAuditHistoryModalProps {
  open: boolean;
  onClose: () => void;
  entityName: string;
  entityId: string;
  entityTitle?: string;
}

interface AuditLogEntry {
  id: string;
  tenantId: string;
  companyId?: string;
  projectId?: string;
  entityName: string;
  entityId: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  performedBy?: string;
  performedAt: string;
  ip?: string;
}

export function EntityAuditHistoryModal({
  open,
  onClose,
  entityName,
  entityId,
  entityTitle,
}: EntityAuditHistoryModalProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string>("ALL");

  useEffect(() => {
    if (!open || !entityId) return;

    let isMounted = true;
    async function fetchAuditTimeline() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get<{ logs: AuditLogEntry[] }>(
          `/api/v1/AuditLogs/entity/${encodeURIComponent(entityName)}/${encodeURIComponent(entityId)}`
        );
        if (isMounted) {
          setLogs(res.data?.logs || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError("Failed to fetch entity audit trail.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void fetchAuditTimeline();
    return () => {
      isMounted = false;
    };
  }, [open, entityName, entityId]);

  if (!open) return null;

  const filteredLogs = logs.filter((l) => {
    if (filterAction === "ALL") return true;
    return l.action?.toUpperCase().includes(filterAction);
  });

  const parseJson = (val?: string): Record<string, unknown> | null => {
    if (!val) return null;
    try {
      return JSON.parse(val);
    } catch {
      return null;
    }
  };

  const getActionBadgeColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("ADDED") || act.includes("CREATE"))
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    if (act.includes("MODIFIED") || act.includes("UPDATE"))
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    if (act.includes("DELETED") || act.includes("REMOVE"))
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
    return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Audit Trail: {entityTitle || entityName}
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {entityName}
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                ID: {entityId}
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(entityId);
                    notifySuccess("Entity ID copied to clipboard.");
                  }}
                  className="hover:text-indigo-600 transition"
                  title="Copy ID"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-2.5 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-900/30 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Filter Action:</span>
            {["ALL", "ADDED", "MODIFIED", "DELETED"].map((act) => (
              <button
                key={act}
                type="button"
                onClick={() => setFilterAction(act)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterAction === act
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {act}
              </button>
            ))}
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            {filteredLogs.length} event{filteredLogs.length === 1 ? "" : "s"} recorded
          </span>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
              <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
              <p className="text-xs font-medium">Loading immutable audit timeline…</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
              <Shield className="h-10 w-10 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Audit Events Logged</p>
              <p className="text-xs text-slate-500 max-w-sm text-center">
                Mutations on this entity will be automatically recorded with field-level change diffs.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 dark:border-slate-800">
              {filteredLogs.map((log) => {
                const oldObj = parseJson(log.oldValue);
                const newObj = parseJson(log.newValue);
                const changedKeys = Array.from(
                  new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})])
                );

                return (
                  <div key={log.id} className="relative pl-6">
                    {/* Timeline Node Dot */}
                    <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white bg-indigo-600 dark:border-slate-900 ring-2 ring-indigo-100 dark:ring-indigo-950" />

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-950/50 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${getActionBadgeColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                          <span className="font-semibold text-slate-900 text-xs dark:text-white">
                            {log.entityName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(log.performedAt)}
                          </span>
                          {log.ip && (
                            <span className="font-mono text-slate-400 hidden sm:inline">
                              IP: {log.ip}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Field Changes Table */}
                      {changedKeys.length > 0 ? (
                        <div className="rounded-lg border border-slate-100 bg-slate-50/50 overflow-hidden dark:border-slate-800 dark:bg-slate-900/40">
                          <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-200/60 bg-slate-100/60 font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                              <tr>
                                <th className="px-3 py-1.5">Property</th>
                                <th className="px-3 py-1.5">Previous Value</th>
                                <th className="px-3 py-1.5">Updated Value</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                              {changedKeys.map((key) => {
                                const oldVal = oldObj ? String(oldObj[key] ?? "—") : "—";
                                const newVal = newObj ? String(newObj[key] ?? "—") : "—";
                                return (
                                  <tr key={key} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/30">
                                    <td className="px-3 py-1.5 font-sans font-medium text-slate-700 dark:text-slate-300">
                                      {key}
                                    </td>
                                    <td className="px-3 py-1.5 text-rose-600 dark:text-rose-400 max-w-[200px] truncate">
                                      {oldVal}
                                    </td>
                                    <td className="px-3 py-1.5 text-emerald-600 dark:text-emerald-400 font-semibold max-w-[200px] truncate">
                                      {newVal}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          Action completed without property delta.
                        </p>
                      )}

                      {log.performedBy && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <User className="h-3 w-3 text-slate-400" />
                          <span>Performed by User ID: <span className="font-mono text-slate-600 dark:text-slate-300">{log.performedBy}</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-200 px-6 py-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
}
