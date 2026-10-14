"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileSearch,
  Search,
  RefreshCw,
  Eye,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  Copy,
  Check,
  ShieldAlert,
  Clock,
  Laptop,
  Download,
} from "lucide-react";
import apiClient from "@/services/apiClient";
import { AuditDiffViewer } from "./AuditDiffViewer";
import { notifySuccess, notifyError } from "@/lib/notifications";

interface AuditLogItem {
  id: string;
  entityName: string;
  entityId: string | null;
  action: string;
  performedAt: string;
  performedBy: string | null;
  ip: string | null;
  oldValue?: string | null;
  newValue?: string | null;
}

interface AuditLogsResponse {
  logs: AuditLogItem[];
  total: number;
  page: number;
  limit: number;
}

export function AuditLogsManager() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchEntity, setSearchEntity] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"diff" | "raw">("diff");

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (searchEntity.trim()) {
        params.set("entity", searchEntity.trim());
      }
      if (actionFilter !== "ALL") {
        params.set("action", actionFilter);
      }

      const res = await apiClient.get<AuditLogsResponse>(`/administration/audit-logs?${params.toString()}`);
      if (res.data) {
        setLogs(res.data.logs || []);
        setTotal(res.data.total || 0);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load audit logs";
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchEntity, actionFilter]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const copyToClipboard = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedField(label);
    notifySuccess(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleExport = (format: "csv" | "json") => {
    const params = new URLSearchParams({ format, limit: "5000" });
    if (searchEntity.trim()) params.set("entity", searchEntity.trim());
    if (actionFilter !== "ALL") params.set("action", actionFilter);
    window.open(`/api/v1/administration/audit-logs/export?${params.toString()}`, "_blank");
  };

  const totalPages = Math.ceil(total / limit) || 1;

  const getActionBadgeColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("CREATE") || act.includes("INSERT") || act.includes("POST")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800";
    }
    if (act.includes("DELETE") || act.includes("REMOVE")) {
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800";
    }
    if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("PATCH") || act.includes("PUT")) {
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800";
    }
    return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800";
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <FileSearch className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Audit Trail & Revision History
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comprehensive immutable ledger of system mutations, entity revisions, and administrative access logs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport("csv")}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            title="Download audit trail as CSV"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => void loadLogs()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by entity name (e.g., User, Company, Invoice, Role)..."
            value={searchEntity}
            onChange={(e) => {
              setSearchEntity(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">Create / Insert</option>
            <option value="UPDATE">Update / Modify</option>
            <option value="DELETE">Delete / SoftDelete</option>
            <option value="LOGIN">Authentication</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Entity</th>
                <th className="py-3 px-4 font-semibold">Entity ID</th>
                <th className="py-3 px-4 font-semibold">Actor / IP</th>
                <th className="py-3 px-4 font-semibold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                      <span>Loading audit entries...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <ShieldAlert className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-medium text-slate-600 dark:text-slate-300">No audit records found</p>
                      <p className="text-xs text-slate-400">Try adjusting your entity filter or action criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedLog(item)}
                    className="hover:bg-slate-50/80 cursor-pointer transition dark:hover:bg-slate-800/40"
                  >
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{new Date(item.performedAt).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getActionBadgeColor(item.action)}`}>
                        {item.action || "UNKNOWN"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {item.entityName}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {item.entityId ? (
                        <span title={item.entityId}>{item.entityId.slice(0, 8)}...</span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col text-[11px]">
                        <span>{item.performedBy ? `User: ${item.performedBy.slice(0, 8)}...` : "System"}</span>
                        {item.ip && (
                          <span className="text-slate-400 flex items-center gap-1">
                            <Laptop className="h-2.5 w-2.5" />
                            {item.ip}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(item);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/50"
                      >
                        <Eye className="h-3 w-3" />
                        View Diff
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{logs.length}</span> of{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{total}</span> records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Drawer / Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity">
          <div className="w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col border-l border-slate-200 dark:bg-slate-900 dark:border-slate-800 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${getActionBadgeColor(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {selectedLog.entityName}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {selectedLog.entityId || "N/A"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(JSON.stringify(selectedLog, null, 2), "Full Log JSON")}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                  title="Copy JSON"
                >
                  {copiedField ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Metadata Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200 text-xs dark:bg-slate-800/40 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Timestamp</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {new Date(selectedLog.performedAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Actor ID</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 truncate block">
                  {selectedLog.performedBy || "System Event"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">IP Address</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {selectedLog.ip || "127.0.0.1"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Log ID</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 truncate block">
                  {selectedLog.id}
                </span>
              </div>
            </div>

            {/* View Tabs */}
            <div className="flex border-b border-slate-200 px-5 dark:border-slate-800">
              <button
                onClick={() => setActiveTab("diff")}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
                  activeTab === "diff"
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                Visual Diff
              </button>
              <button
                onClick={() => setActiveTab("raw")}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
                  activeTab === "raw"
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                Raw JSON
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === "diff" ? (
                <AuditDiffViewer
                  oldValue={selectedLog.oldValue}
                  newValue={selectedLog.newValue}
                  action={selectedLog.action}
                />
              ) : (
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                      Old Value Snapshot
                    </span>
                    <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-64">
                      {selectedLog.oldValue || "// null"}
                    </pre>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                      New Value Snapshot
                    </span>
                    <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-64">
                      {selectedLog.newValue || "// null"}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
