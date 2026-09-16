"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
﻿
import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import HeaderSummary from "@/components/layout/HeaderSummary";
import { CrudCard } from "@/components/workspace/crud-workspace";
import { ErpRefreshButton, ErpTabBar, ErpTabPanel } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { reportsApi } from "@/services/modules";

type AuditEntry = {
  id?: string;
  action?: string;
  entityName?: string;
  performedBy?: string;
  createdAt?: string;
  description?: string;
};
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

type TabKey = "audit" | "quality";

function LegacyComplianceReportsPage() {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [dataQuality, setDataQuality] = useState<DataQuality | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("audit");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
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
          })),
        );
      }
      const qualityPayload = qualityRes.data as DataQuality | null;
      setDataQuality(
        qualityPayload
          ? {
              totalRecords: qualityPayload.totalRecords ?? qualityPayload.totalEmployees,
              issueCount:
                qualityPayload.issueCount ??
                (qualityPayload.missingEmployeeCode ?? 0) +
                  (qualityPayload.missingProject ?? 0) +
                  (qualityPayload.missingManager ?? 0),
              score: qualityPayload.score ?? qualityPayload.dataQualityScore,
              issues: qualityPayload.issues,
            }
          : null,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load compliance reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const score = dataQuality?.score ?? 0;
  const auditRows = useMemo(() => auditLog.slice(0, 50), [auditLog]);
  const qualityIssueRows = useMemo(() => dataQuality?.issues ?? [], [dataQuality?.issues]);

  const auditList = useErpListView({
    listKey: "reports-compliance-audit",
    rows: auditRows,
    loading: loading && activeTab === "audit",
    emptyMessage: "No audit records found.",
    getRowId: (row) => row.id || `${row.entityName}-${row.action}-${row.createdAt}`,
    onRefresh: () => void load(),
    columns: [
      { key: "createdAt", label: "Date", dataType: "string" },
      { key: "action", label: "Action", dataType: "string" },
      { key: "entityName", label: "Entity", dataType: "string" },
      { key: "performedBy", label: "Performed By", dataType: "string" },
      { key: "description", label: "Details", dataType: "string" },
    ],
    renderRow: (entry) => (
      <>
        <td className="erp-td text-xs font-mono text-slate-600">
          {entry.createdAt ? new Date(entry.createdAt).toLocaleString("en-IN") : "-"}
        </td>
        <td className="erp-td">
          <span className="erp-chip erp-chip-info">{entry.action || "-"}</span>
        </td>
        <td className="erp-td text-slate-700">{entry.entityName || "-"}</td>
        <td className="erp-td text-slate-600">{entry.performedBy || "-"}</td>
        <td className="erp-td max-w-xs truncate text-xs text-slate-500">{entry.description || "-"}</td>
      </>
    ),
  });

  const qualityList = useErpListView({
    listKey: "reports-compliance-quality",
    rows: qualityIssueRows,
    loading: loading && activeTab === "quality",
    emptyMessage: "No data quality issues detected. System is clean.",
    getRowId: (row) => `${row.entity}-${row.type}-${row.count}`,
    onRefresh: () => void load(),
    columns: [
      { key: "entity", label: "Entity", dataType: "string" },
      { key: "type", label: "Issue Type", dataType: "string" },
      { key: "count", label: "Count", dataType: "number" },
    ],
    renderRow: (issue) => (
      <>
        <td className="erp-td font-medium text-slate-900">{issue.entity}</td>
        <td className="erp-td">
          <span className="erp-chip erp-chip-warning">{issue.type}</span>
        </td>
        <td className="erp-td text-slate-600">{issue.count}</td>
      </>
    ),
  });

  const tabItems = [
    { key: "audit", label: "Audit Log", count: auditRows.length },
    { key: "quality", label: "Data Quality", count: qualityIssueRows.length },
  ];

  const activeListTools = activeTab === "audit" ? auditList.headerTools : qualityList.headerTools;
  const activeFilterBar = activeTab === "audit" ? auditList.filterBar : qualityList.filterBar;

  return (
    <StandardPageLayout
      title="Compliance Reports"
      subtitle="Audit trails, data quality scores, and module usage analytics for governance reporting."
      eyebrow="Reports / Compliance & Governance"
      icon="shield"
      meta={
        <HeaderSummary
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
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          {activeListTools}
        </>
      }
      filters={activeFilterBar}
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <ErpTabBar tabs={tabItems} active={activeTab} onChange={(key) => setActiveTab(key as TabKey)} />

      <ErpTabPanel hidden={activeTab !== "audit"}>
        <CrudCard>{auditList.table}</CrudCard>
      </ErpTabPanel>

      <ErpTabPanel hidden={activeTab !== "quality"}>
        <CrudCard>{qualityList.table}</CrudCard>
      </ErpTabPanel>
    </StandardPageLayout>
  );
}

export default function ComplianceReportsPage() {
  return (
    <DynamicPage
      pageKey="reports.compliance"
      fallback={<LegacyComplianceReportsPage />}
      renderMode="auto"
    />
  );
}
