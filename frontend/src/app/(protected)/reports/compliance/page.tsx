"use client";

import { useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";
import { reportsApi } from "@/services/modules";
type AuditEntry = { id?: string; action?: string; entityName?: string; performedBy?: string; createdAt?: string; description?: string };
type DataQuality = {
  totalRecords?: number;
  totalEmployees?: number;
  issueCount?: number;
  score?: number;
  dataQualityScore?: number;
  missingEmployeeCode?: number;
  missingProject?: number;
  missingManager?: number;
  issues?: { entity: string; count: number; type: string }[];
};

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
          reportsApi.compliance.auditLog(),
          reportsApi.compliance.dataQuality(),
        ]);
        const auditPayload = auditRes.data as
          | AuditEntry[]
          | { breakdown?: { entity?: string; action?: string; count?: number }[]; totalLogs?: number }
          | undefined;
        if (Array.isArray(auditPayload)) {
          setAuditLog(auditPayload);
        } else {
          setAuditLog(
            (auditPayload?.breakdown ?? []).map((row, index) => ({
              id: `${row.entity}-${row.action}-${index}`,
              action: row.action,
              entityName: row.entity,
              description: `${row.count ?? 0} events`,
            }))
          );
        }
        const qualityPayload = qualityRes.data as DataQuality | null;
        setDataQuality(
          qualityPayload
            ? {
                totalRecords: qualityPayload.totalRecords ?? qualityPayload.totalEmployees,
                issueCount:
                  qualityPayload.issueCount ??
                  ((qualityPayload.missingEmployeeCode ?? 0) +
                    (qualityPayload.missingProject ?? 0) +
                    (qualityPayload.missingManager ?? 0)),
                score: qualityPayload.score ?? qualityPayload.dataQualityScore,
                issues: qualityPayload.issues,
              }
            : null
        );
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load compliance reports");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const score = dataQuality?.score ?? 0;

  return (
    <StandardPageLayout
      title="Compliance Reports"
      subtitle="Audit trails, data quality scores, and module usage analytics for governance reporting."
      eyebrow="Reports / Compliance & Governance"
      icon="shield"
      meta={
        <ErpHeaderSummary
          items={[
            { label: "Audit Entries", value: auditLog.length, tone: "info" },
            {
              label: "Quality Score",
              value: `${score}%`,
              tone: score >= 90 ? "success" : score >= 70 ? "warning" : "danger",
            },
            { label: "Records", value: dataQuality?.totalRecords ?? "-" },
            { label: "Issues", value: dataQuality?.issueCount ?? "-", tone: "warning" },
          ]}
        />
      }
    >
      {error && <div className="erp-alert-error">{error}</div>}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div className="erp-tabs-list">
            <button type="button" onClick={() => setActiveTab("audit")} className={activeTab === "audit" ? "erp-tab-trigger erp-tab-trigger-active" : "erp-tab-trigger"}>Audit Log</button>
            <button type="button" onClick={() => setActiveTab("quality")} className={activeTab === "quality" ? "erp-tab-trigger erp-tab-trigger-active" : "erp-tab-trigger"}>Data Quality</button>
          </div>
        </div>
        <div className="erp-panel-body">
          {loading ? (
            <div className="erp-loading">Loading compliance data...</div>
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
                        auditLog.slice(0, 50).map((entry, index) => (
                          <tr key={entry.id || index} className="erp-tr">
                            <td className="erp-td text-xs font-mono text-slate-600">
                              {entry.createdAt ? new Date(entry.createdAt).toLocaleString("en-IN") : "-"}
                            </td>
                            <td className="erp-td"><span className="erp-chip erp-chip-info">{entry.action || "-"}</span></td>
                            <td className="erp-td text-slate-700">{entry.entityName || "-"}</td>
                            <td className="erp-td text-slate-600">{entry.performedBy || "-"}</td>
                            <td className="erp-td max-w-xs truncate text-xs text-slate-500">{entry.description || "-"}</td>
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
                          {dataQuality.issues.map((issue, index) => (
                            <tr key={index} className="erp-tr">
                              <td className="erp-td font-medium text-slate-900">{issue.entity}</td>
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
