"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PERMISSIONS } from "@/constants/permissions";
import { hrApi } from "@/services/hrApi";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifySuccess } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Eye, Shield, Activity, FileText, UserCheck, AlertTriangle } from "lucide-react";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";

interface AuditRow {
  id: string;
  entityName: string;
  entityId?: string | null;
  action: string;
  performedAt: string;
  performedBy?: string | null;
  ip?: string | null;
  details?: Record<string, unknown>;
}

interface AuditLogResponse {
  logs?: AuditRow[];
  total?: number;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const [selectedLog, setSelectedLog] = useState<AuditRow | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrApi.platform.auditLogs({
        page,
        limit: pageSize,
        entity: entityFilter !== "all" ? entityFilter : undefined,
        action: actionFilter !== "all" ? actionFilter : undefined,
      });
      const data = (res.data || {}) as AuditLogResponse;
      setLogs(data.logs ?? []);
      setTotal(data.total ?? data.logs?.length ?? 0);
    } catch (err) {
      setLogs([]);
      setTotal(0);
      setError(getApiErrorMessage(err, "Failed to load audit logs."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs();
  }, [page, pageSize, entityFilter, actionFilter]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        log.entityName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        (log.performedBy || "").toLowerCase().includes(q) ||
        (log.entityId || "").toLowerCase().includes(q);
      const matchesEntity = entityFilter === "all" || log.entityName.toLowerCase() === entityFilter.toLowerCase();
      const matchesAction = actionFilter === "all" || log.action.toLowerCase() === actionFilter.toLowerCase();
      return matchesSearch && matchesEntity && matchesAction;
    });
  }, [logs, search, entityFilter, actionFilter]);

  const handleExportCSV = () => {
    const headers = ["ID", "Entity", "Action", "Entity ID", "Performed By", "IP Address", "Timestamp"];
    const csvRows = filteredLogs.map((l) => [
      l.id,
      l.entityName,
      l.action,
      l.entityId || "",
      l.performedBy || "",
      l.ip || "",
      new Date(l.performedAt).toISOString(),
    ]);

    const csvContent = [headers.join(","), ...csvRows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `audit_logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notifySuccess("Exported audit log CSV.");
  };

  const kpis: KpiMetricItem[] = [
    { label: "Total Audit Records", value: total, tone: "info", icon: <FileText className="h-3.5 w-3.5" />, subtext: "Immutable" },
    { label: "Tracked Entities", value: new Set(logs.map((l) => l.entityName)).size, tone: "positive", icon: <Shield className="h-3.5 w-3.5" />, subtext: "Verified" },
    { label: "Unique Performers", value: new Set(logs.map((l) => l.performedBy)).size, tone: "warning", icon: <UserCheck className="h-3.5 w-3.5" />, subtext: "Actors" },
    { label: "Critical Actions", value: logs.filter((l) => l.action.includes("DELETE") || l.action.includes("UPDATE")).length, tone: "negative", icon: <AlertTriangle className="h-3.5 w-3.5" />, subtext: "Mutations" }
  ];

  return (
    <ProtectedRoute permission={PERMISSIONS.AUDIT_VIEW}>
      <PlatformGlobalPageShell
        title="Audit Logs & Governance Ledger"
        subtitle="Immutable security stream tracking entity mutations, configuration changes, user permissions, and compliance events."
        categoryTag="Security & Audit Governance"
        kpiMetrics={kpis}
        searchPlaceholder="Filter audit records by entity, action, user email, or IP address..."
        searchValue={search}
        onSearchChange={setSearch}
        filterOptions={[
          {
            key: "entity",
            label: "All Entities",
            value: entityFilter,
            onChange: setEntityFilter,
            options: [
              { label: "All Entities", value: "all" },
              { label: "Tenant", value: "tenant" },
              { label: "User", value: "user" },
              { label: "SalesOrder", value: "salesorder" },
              { label: "Company", value: "company" },
              { label: "PayrollRun", value: "payrollrun" },
            ]
          },
          {
            key: "action",
            label: "All Actions",
            value: actionFilter,
            onChange: setActionFilter,
            options: [
              { label: "All Actions", value: "all" },
              { label: "CREATE", value: "create" },
              { label: "UPDATE", value: "update" },
              { label: "DELETE", value: "delete" },
              { label: "ROLE_UPDATE", value: "role_update" },
              { label: "EXECUTE", value: "execute" },
            ]
          }
        ]}
        onClearFilters={() => {
          setSearch("");
          setEntityFilter("all");
          setActionFilter("all");
          setPage(1);
        }}
        onRefresh={fetchLogs}
        onExportCsv={handleExportCSV}
        isLoading={loading}
        currentPage={page}
        totalPages={Math.max(1, Math.ceil(total / pageSize))}
        totalRecords={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isInspectorOpen={!!selectedLog}
        onInspectorClose={() => setSelectedLog(null)}
        inspectorTitle={`Audit Event: ${selectedLog?.entityName} (${selectedLog?.action})`}
        inspectorSubTitle={`Event ID #${selectedLog?.id} • Timestamp: ${selectedLog ? new Date(selectedLog.performedAt).toLocaleString() : ""}`}
        inspectorContent={
          selectedLog && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 font-medium">Entity Target:</span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedLog.entityName}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Action Mutation:</span>
                  <p className="font-semibold text-indigo-600 dark:text-indigo-400">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Actor User:</span>
                  <p className="font-mono text-slate-800 dark:text-slate-200">{selectedLog.performedBy || "System"}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Client IP Address:</span>
                  <p className="font-mono text-slate-800 dark:text-slate-200">{selectedLog.ip || "127.0.0.1"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Payload State & Context:</span>
                <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto max-h-[300px] border border-slate-800 leading-relaxed shadow-inner">
                  {JSON.stringify(selectedLog.details || { entityId: selectedLog.entityId, timestamp: selectedLog.performedAt }, null, 2)}
                </pre>
              </div>

              <div className="pt-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                  Close Inspector
                </Button>
              </div>
            </div>
          )
        }
      >
        {/* Table View */}
        <div className="erp-table-wrap rounded-none border-0 shadow-none">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Target Entity</th>
                <th className="erp-th">Action Type</th>
                <th className="erp-th">Entity Record ID</th>
                <th className="erp-th">Performed By</th>
                <th className="erp-th">Source IP</th>
                <th className="erp-th">Timestamp</th>
                <th className="erp-th text-right">Inspect Payload</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="erp-td">
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-indigo-500" />
                      {log.entityName}
                    </span>
                  </td>
                  <td className="erp-td">
                    <span className={`erp-chip ${
                      log.action.includes("DELETE") || log.action.includes("REMOVE")
                        ? "erp-chip-danger"
                        : log.action.includes("CREATE")
                        ? "erp-chip-success"
                        : "erp-chip-info"
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="erp-td font-mono text-xs text-slate-500">{log.entityId || "-"}</td>
                  <td className="erp-td text-xs text-slate-700 dark:text-slate-300 font-medium">{log.performedBy || "-"}</td>
                  <td className="erp-td font-mono text-xs text-slate-500">{log.ip || "-"}</td>
                  <td className="erp-td text-xs text-slate-500">{new Date(log.performedAt).toLocaleString()}</td>
                  <td className="erp-td text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50" onClick={() => setSelectedLog(log)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}

              {!loading && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="erp-td py-12 text-center text-sm text-slate-500">
                    No audit records found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PlatformGlobalPageShell>
    </ProtectedRoute>
  );
}
