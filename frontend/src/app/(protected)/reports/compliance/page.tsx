"use client";

import { useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

export default function ComplianceReportsPage() {
  const [auditLog, setAuditLog] = useState<any | null>(null);
  const [dataQuality, setDataQuality] = useState<any | null>(null);
  const [moduleUsage, setModuleUsage] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [showAuditForm, setShowAuditForm] = useState(false);
  const [auditForm, setAuditForm] = useState({
    auditType: "PF_AUDIT",
    financialYear: new Date().getFullYear(),
    totalRecordsChecked: 0,
    auditFindings: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const [auditRes, qualityRes, usageRes, auditsRes] = await Promise.all([
          hrApi.reports.compliance.auditLog(),
          hrApi.reports.compliance.dataQuality(),
          hrApi.reports.compliance.moduleUsage(),
          hrApi.compliance.audits.list(),
        ]);
        setAuditLog(auditRes.data ?? null);
        setDataQuality(qualityRes.data ?? null);
        setModuleUsage(Array.isArray(usageRes.data) ? usageRes.data : []);
        setAudits(Array.isArray(auditsRes.data) ? auditsRes.data : []);
      } catch (err: any) {
        setError(err.message || "Failed to load compliance reports");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleCreateAudit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await hrApi.compliance.audits.create(auditForm);
      const auditsRes = await hrApi.compliance.audits.list();
      setAudits(Array.isArray(auditsRes.data) ? auditsRes.data : []);
      setShowAuditForm(false);
      setAuditForm({
        auditType: "PF_AUDIT",
        financialYear: new Date().getFullYear(),
        totalRecordsChecked: 0,
        auditFindings: "",
      });
    } catch (err) {
      notifyError(getApiErrorMessage(err, 'Failed to create compliance audit.'), 'Compliance Audit');
    }
  };

  return (
    <StandardPageLayout title="Compliance Reports" subtitle="Statutory, quality, and audit-ready reporting for enterprise governance.">

      {loading && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">Loading compliance reports...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-medium">Error: {error}</p>
        </div>
      )}

      {/* KPI summary cards */}
      <div className="erp-kpi-grid mb-4">
        <div className="erp-kpi-card"><p className="erp-kpi-label">Audit Events</p><p className="erp-kpi-value">{audits.length}</p><p className="erp-kpi-meta">Audit log entries</p></div>
        <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Module Coverage</p><p className="erp-kpi-value">{moduleUsage.length}</p><p className="erp-kpi-meta">Modules with usage data</p></div>
        <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Entities</p><p className="erp-kpi-value erp-kpi-value-success">{new Set(audits.map((a: {entity?: string}) => a.entity).filter(Boolean)).size}</p><p className="erp-kpi-meta">Distinct audited entities</p></div>
        <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Actions</p><p className="erp-kpi-value">{new Set(audits.map((a: {action?: string}) => a.action).filter(Boolean)).size}</p><p className="erp-kpi-meta">Distinct action types</p></div>
      </div>

      {!loading && !error && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-800">Audit Log Summary</h2>
            <p className="mt-2 text-sm text-gray-600">Total logs: {auditLog?.totalLogs ?? 0}</p>
            {auditLog?.breakdown?.length ? (
              <ul className="mt-4 space-y-2 text-sm">
                {auditLog.breakdown.slice(0, 5).map((item: any, index: number) => (
                  <li key={`${item.entity}-${item.action}-${index}`} className="flex items-center justify-between border-b border-gray-100 py-2">
                    <span className="text-gray-900">{item.entity} / {item.action}</span>
                    <span className="text-gray-600">{item.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-gray-600">No audit log data.</p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-800">Data Quality</h2>
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <p>Missing employee codes: {dataQuality?.missingEmployeeCode ?? 0}</p>
              <p>Missing project assignments: {dataQuality?.missingProject ?? 0}</p>
              <p>Missing managers: {dataQuality?.missingManager ?? 0}</p>
              <p className="font-semibold text-gray-900">Score: {dataQuality?.dataQualityScore ?? 0}%</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-800">Module Usage</h2>
            {moduleUsage.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">No module usage data.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {moduleUsage.slice(0, 6).map((item: any) => (
                  <li key={item.moduleKey} className="flex items-center justify-between border-b border-gray-100 py-2">
                    <span className="text-gray-900">{item.displayName || item.moduleKey}</span>
                    <span className="text-gray-600">{item.enabledTenants ?? 0}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Compliance Audits</h2>
            <button
              type="button"
              onClick={() => setShowAuditForm((prev) => !prev)}
              className="erp-action-btn erp-action-btn-primary"
            >
              {showAuditForm ? "Cancel" : "New Audit"}
            </button>
          </div>

          {showAuditForm && (
            <form onSubmit={handleCreateAudit} className="mt-4 grid gap-3 md:grid-cols-4">
              <div>
                <label className="block text-xs font-medium text-gray-600">Audit Type</label>
                <select
                  value={auditForm.auditType}
                  onChange={(event) => setAuditForm({ ...auditForm, auditType: event.target.value })}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-2 text-sm"
                >
                  <option value="PF_AUDIT">PF Audit</option>
                  <option value="ESI_AUDIT">ESI Audit</option>
                  <option value="IT_AUDIT">IT Audit</option>
                  <option value="PT_AUDIT">PT Audit</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Financial Year</label>
                <input
                  type="number"
                  value={auditForm.financialYear}
                  onChange={(event) =>
                    setAuditForm({ ...auditForm, financialYear: Number(event.target.value) })
                  }
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Records Checked</label>
                <input
                  type="number"
                  value={auditForm.totalRecordsChecked}
                  onChange={(event) =>
                    setAuditForm({ ...auditForm, totalRecordsChecked: Number(event.target.value) })
                  }
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-600">Findings</label>
                <textarea
                  value={auditForm.auditFindings}
                  onChange={(event) => setAuditForm({ ...auditForm, auditFindings: event.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-4">
                <button
                  type="submit"
                  className="erp-action-btn erp-action-btn-primary"
                >
                  Create Audit
                </button>
              </div>
            </form>
          )}

          {audits.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">No compliance audits available.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Type</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Year</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Checked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {audits.map((audit: any) => (
                    <tr key={audit.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{audit.auditType || "-"}</td>
                      <td className="px-4 py-2 text-gray-600">{audit.financialYear}</td>
                      <td className="px-4 py-2 text-gray-600">{audit.status}</td>
                      <td className="px-4 py-2 text-gray-600">{audit.totalRecordsChecked}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </StandardPageLayout>
  );
}
