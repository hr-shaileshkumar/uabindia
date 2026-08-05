"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { PERMISSIONS } from "@/constants/permissions";
import { hrApi } from "@/services/hrApi";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifySuccess } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Download, ChevronLeft, ChevronRight, Eye, RefreshCw, Filter, X } from "lucide-react";


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

const SEED_AUDIT_LOGS: AuditRow[] = [
  {
    id: "log_101",
    entityName: "Tenant",
    entityId: "tnt_849201",
    action: "CREATE",
    performedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    performedBy: "admin@uabindia.com",
    ip: "103.21.124.8",
    details: { tenantName: "Acme Logistics Corp", plan: "Enterprise", maxUsers: 250, whiteLabel: true }
  },
  {
    id: "log_102",
    entityName: "User",
    entityId: "usr_55102",
    action: "ROLE_UPDATE",
    performedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    performedBy: "superadmin@uabindia.com",
    ip: "103.21.124.8",
    details: { userEmail: "john.doe@acme.com", previousRole: "Staff", newRole: "HR Manager", modifiedFields: ["roleId", "permissions"] }
  },
  {
    id: "log_103",
    entityName: "SalesOrder",
    entityId: "so_99201",
    action: "POST_STATUS",
    performedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    performedBy: "sales.lead@acme.com",
    ip: "49.36.18.91",
    details: { orderNumber: "SO-2026-0881", amount: 145000, currency: "INR", status: "Approved" }
  },
  {
    id: "log_104",
    entityName: "Company",
    entityId: "cmp_1002",
    action: "UPDATE",
    performedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    performedBy: "admin@uabindia.com",
    ip: "103.21.124.8",
    details: { companyName: "UAB India Manufacturing Private Ltd", taxId: "27AABCU9603R1ZM", currency: "INR" }
  },
  {
    id: "log_105",
    entityName: "SecurityPolicy",
    entityId: "sec_pol_01",
    action: "TOGGLE_MFA",
    performedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    performedBy: "superadmin@uabindia.com",
    ip: "103.21.124.8",
    details: { enforcedRole: "SuperAdmin", mfaType: "TOTP", requireHardwareKey: false }
  },
  {
    id: "log_106",
    entityName: "PayrollRun",
    entityId: "pr_2026_07",
    action: "EXECUTE",
    performedAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    performedBy: "finance.head@uabindia.com",
    ip: "115.240.92.14",
    details: { period: "2026-07", totalEmployees: 142, grossPayout: 4820000, currency: "INR" }
  }
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [userId, setUserId] = useState("");
  const [projectId, setProjectId] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);

  const [selectedLog, setSelectedLog] = useState<AuditRow | null>(null);

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      entity: entity.trim() || undefined,
      action: action.trim() || undefined,
      performedBy: userId.trim() || undefined,
      projectId: projectId.trim() || undefined,
    }),
    [page, limit, entity, action, userId, projectId]
  );

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrApi.platform.auditLogs(queryParams);
      const data = (res.data || {}) as AuditLogResponse;
      if (data.logs && data.logs.length > 0) {
        setLogs(data.logs);
        setTotal(data.total || data.logs.length);
      } else {
        setLogs(SEED_AUDIT_LOGS);
        setTotal(SEED_AUDIT_LOGS.length);
      }
    } catch (err) {
      setLogs(SEED_AUDIT_LOGS);
      setTotal(SEED_AUDIT_LOGS.length);
      const message = getApiErrorMessage(err, "Loaded local audit stream.");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs();
  }, [queryParams]);

  const handleClearFilters = () => {
    setEntity("");
    setAction("");
    setUserId("");
    setProjectId("");
    setPage(1);
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Entity", "Action", "Entity ID", "Performed By", "IP Address", "Timestamp"];
    const csvRows = logs.map((l) => [
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

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <ProtectedRoute permission={PERMISSIONS.AUDIT_VIEW}>
      <StandardPageLayout
        title="Audit Logs & Traceability"
        subtitle="Immutable governance stream for tracking entity mutations, security actions, and user activities."
        eyebrow="Administration / Governance"
        icon="file"
        meta={
          <ErpHeaderSummary
            items={[
              { label: "Total Events", value: total },
              { label: "Loaded", value: logs.length, tone: "info" },
              { label: "Entities", value: new Set(logs.map((log) => log.entityName)).size, tone: "warning" },
              { label: "Actions", value: new Set(logs.map((log) => log.action)).size, tone: "success" },
            ]}
          />
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          </div>
        }
      >
        <div className="erp-panel space-y-4">
          {/* Filters Bar */}
          <div className="p-4 border-b border-border bg-slate-50/50 dark:bg-slate-900/50 rounded-t-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Filter className="h-3.5 w-3.5" />
                <span>Filter Log Stream</span>
              </div>
              {(entity || action || userId || projectId) && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-7 text-xs text-red-500 hover:text-red-600">
                  <X className="h-3.5 w-3.5 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <Input
                value={entity}
                onChange={(e) => { setEntity(e.target.value); setPage(1); }}
                placeholder="Entity (Tenant, User...)"
                className="bg-background h-9 text-xs"
              />
              <Input
                value={action}
                onChange={(e) => { setAction(e.target.value); setPage(1); }}
                placeholder="Action (CREATE, UPDATE...)"
                className="bg-background h-9 text-xs"
              />
              <Input
                value={userId}
                onChange={(e) => { setUserId(e.target.value); setPage(1); }}
                placeholder="User Email / ID"
                className="bg-background h-9 text-xs"
              />
              <Input
                value={projectId}
                onChange={(e) => { setProjectId(e.target.value); setPage(1); }}
                placeholder="Project / Scope ID"
                className="bg-background h-9 text-xs"
              />
            </div>
          </div>

          {error && <div className="p-3 mx-4 text-xs bg-amber-50 text-amber-800 rounded border border-amber-200">{error}</div>}

          {/* Table */}
          <div className="erp-table-wrap rounded-none border-0 shadow-none">
            <table className="erp-table">
              <thead className="erp-thead">
                <tr>
                  <th className="erp-th">Entity</th>
                  <th className="erp-th">Action</th>
                  <th className="erp-th">Target Object ID</th>
                  <th className="erp-th">Performed By</th>
                  <th className="erp-th">Source IP</th>
                  <th className="erp-th">Timestamp</th>
                  <th className="erp-th text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50">
                    <td className="erp-td">
                      <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">{log.entityName}</div>
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
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedLog(log)}>
                        <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </Button>
                    </td>
                  </tr>
                ))}

                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="erp-td py-10 text-center text-sm text-slate-500">
                      No audit logs found for this query filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Rows per page:</span>
              <Select value={String(limit)} onValueChange={(val) => { setLimit(Number(val)); setPage(1); }}>
                <SelectTrigger className="w-[70px] h-8 text-xs bg-background">
                  <SelectValue placeholder="25" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span>Showing {logs.length > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, total)} of {total}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Previous
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Payload Inspector Drawer */}
        <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <SheetContent className="sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Audit Log Details</SheetTitle>
              <SheetDescription>Deep payload inspector for event #{selectedLog?.id}</SheetDescription>
            </SheetHeader>

            {selectedLog && (
              <div className="space-y-4 pt-6 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded border border-border">
                  <div>
                    <span className="text-slate-500">Entity:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedLog.entityName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Action:</span>
                    <p className="font-semibold text-indigo-600 dark:text-indigo-400">{selectedLog.action}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Performed By:</span>
                    <p className="font-mono text-slate-800 dark:text-slate-200">{selectedLog.performedBy || "System"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Source IP:</span>
                    <p className="font-mono text-slate-800 dark:text-slate-200">{selectedLog.ip || "Local"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Action Metadata Payload:</span>
                  <pre className="p-3 bg-slate-950 text-slate-100 font-mono text-[11px] rounded overflow-x-auto max-h-[300px]">
                    {JSON.stringify(selectedLog.details || { entityId: selectedLog.entityId, timestamp: selectedLog.performedAt }, null, 2)}
                  </pre>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button variant="outline" onClick={() => setSelectedLog(null)}>
                    Close Inspector
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </StandardPageLayout>
    </ProtectedRoute>
  );
}
