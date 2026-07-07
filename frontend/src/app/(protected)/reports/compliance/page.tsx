"use client";

import { useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";

type AuditEntry = { id?: string; action?: string; entityName?: string; performedBy?: string; createdAt?: string; description?: string };
type DataQuality = { totalRecords?: number; issueCount?: number; score?: number; issues?: { entity: string; count: number; type: string }[] };

export default function ComplianceReportsPage() {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [dataQuality, setDataQuality] = useState<DataQuality | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"audit" | "quality">("audit");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [auditRes, qualityRes] = await Promise.all([
          hrApi.reports.compliance.auditLog(),
          hrApi.reports.compliance.dataQuality(),
        ]);
        setAuditLog(Array.isArray(auditRes.data) ? auditRes.data : Array.isArray(auditRes.data?.logs) ? auditRes.data.logs : []);
        setDataQuality(qualityRes.data ?? null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load compliance reports");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const score = dataQuality?.score ?? 0;
  const scoreColor = score >= 90 ? "text-emerald-600" : score >= 70 ? "text-amber-600" : "text-red-600";

  return (
    <StandardPageLayout
      title="Compliance Reports"
      subtitle="Audit trails, data quality scores, and module usage analytics for governance reporting."
      eyebrow="Reports / Compliance & Governance"
      icon="shield"
    >
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Audit Entries</p>
          <p className="erp-kpi-value">{auditLog.length}</p>
          <p className="erp-kpi-meta">Loaded audit log records</p>
        </div>
        <div className={`erp-kpi-card ${score >= 90 ? "erp-kpi-card-success" : score >= 70 ? "erp-kpi-card-warning" : "erp-kpi-card-danger"}`}>
          <p className="erp-kpi-label">Data Quality Score</p>
          <p className={`erp-kpi-value ${scoreColor}`}>{score}%</p>
          <p className="erp-kpi-meta">Overall data health rating</p>
        </div>
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Total Records</p>
          <p className="erp-kpi-value">{dataQuality?.totalRecords ?? "—"}</p>
          <p className="erp-kpi-meta">Records analysed</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-warning">
          <p className="erp-kpi-label">Issues Found</p>
          <p className="erp-kpi-value">{dataQuality?.issueCount ?? "—"}</p>
          <p className="erp-kpi-meta">Data quality issues</p>
        </div>
      </div>

      {error && <div className="erp-alert-error">{error}</div>}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div className="erp-tabs-list">
            <button type="button" onClick={() => setActiveTab("audit")} className={activeTab === "audit" ? "erp-tab-trigger erp-tab-trigger-active" : "erp-tab-trigger"}>
              Audit Log
            </button>
            <button type="button" onClick={() => setActiveTab("quality")} className={activeTab === "quality" ? "erp-tab-trigger erp-tab-trigger-active" : "erp-tab-trigger"}>
              Data Quality
            </button>
          </div>
        </div>
        <div className="erp-panel-body">
          {loading ? (
            <div className="erp-loading">Loading compliance data…</div>
          ) : (
            <>
              {activeTab === "audit" && (
                <div className="overflow-x-auto bg-white/80">
                  <table className="erp-table">
                    <thead className="erp-thead">
                      <tr>
                        <th className="erp-th">Date</th>
                        <th className="erp-th">Action</th>
                        <th className="erp-th">Entity</th>
                        <th className="erp-th">Performed By</th>
                        <th className="erp-th">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLog.length === 0 ? (
                        <tr><td colSpan={5} className="erp-td py-10 text-center text-slate-400">No audit records found.</td></tr>
                      ) : (
                        auditLog.slice(0, 50).map((entry, i) => (
                          <tr key={entry.id || i} className="erp-tr">
                            <td className="erp-td text-slate-600 text-xs font-mono">
                              {entry.createdAt ? new Date(entry.createdAt).toLocaleString("en-IN") : "—"}
                            </td>
                            <td className="erp-td">
                              <span className="erp-chip erp-chip-info">{entry.action || "—"}</span>
                            </td>
                            <td className="erp-td text-slate-700">{entry.entityName || "—"}</td>
                            <td className="erp-td text-slate-600">{entry.performedBy || "—"}</td>
                            <td className="erp-td text-slate-500 text-xs max-w-xs truncate">{entry.description || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "quality" && (
                <div className="space-y-4">
                  {dataQuality?.issues && dataQuality.issues.length > 0 ? (
                    <div className="overflow-x-auto bg-white/80">
                      <table className="erp-table">
                        <thead className="erp-thead">
                          <tr>
                            <th className="erp-th">Entity</th>
                            <th className="erp-th">Issue Type</th>
                            <th className="erp-th">Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dataQuality.issues.map((issue, i) => (
                            <tr key={i} className="erp-tr">
                              <td className="erp-td text-slate-900 font-medium">{issue.entity}</td>
                              <td className="erp-td"><span className="erp-chip erp-chip-warning">{issue.type}</span></td>
                              <td className="erp-td text-slate-600">{issue.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="erp-empty">No data quality issues detected. System is clean.</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </StandardPageLayout>
  );
}
