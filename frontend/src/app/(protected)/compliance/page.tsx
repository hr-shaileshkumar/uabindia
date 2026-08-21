"use client";

import { useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import { StatusBadge } from "@/components/erp/status-badge";
import { EmptyState } from "@/components/erp/empty-state";
import { erpButtonClassName, erpFormInputClassName, erpTableTdClassName, erpTableThClassName } from "@/components/erp/erpStyles";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useComplianceReports } from "@/features/compliance/hooks/useComplianceReports";

const complianceStatusTone = (status: string) => {
  if (status.toLowerCase().includes("filed")) return "positive" as const;
  if (status.toLowerCase().includes("pending") || status.toLowerCase().includes("due")) return "warning" as const;
  return "neutral" as const;
};

export default function StatutoryCompliancePage() {
  const { data = [], isLoading, isError, error, refetch } = useComplianceReports(1, 50);
  const [search, setSearch] = useState("");

  const filtered = data.filter((row) => {
    const q = search.toLowerCase();
    return !q || row.actName.toLowerCase().includes(q) || row.code.toLowerCase().includes(q);
  });

  return (
    <StandardPageLayout
      title="Statutory Compliance & Regulatory Returns"
      subtitle="Compliance reports from the compliance module API."
      eyebrow="Regulatory Governance / Compliance"
      icon="shield"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Reports", value: data.length, helper: "live API" },
            { label: "Filed", value: data.filter((r) => r.status.includes("Filed")).length, tone: "positive" },
          ]}
        />
      }
      filters={
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter act name or code…"
            className={`${erpFormInputClassName} pl-9`}
          />
        </div>
      }
      actions={
        <button type="button" onClick={() => void refetch()} className={erpButtonClassName.secondary}>
          Refresh
        </button>
      }
    >
      {isError && (
        <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load compliance reports.")}</div>
      )}

      <CrudCard title="Compliance report register" description="Statutory filings and regulatory return status.">
        {isLoading ? (
          <div className="erp-loading">Loading compliance reports…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No compliance reports found"
            description="Regulatory return records will appear here once configured in the compliance module."
            ctaLabel="Refresh list"
            onClick={() => void refetch()}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className={erpTableThClassName}>Act / Report</th>
                  <th className={erpTableThClassName}>Code</th>
                  <th className={erpTableThClassName}>Frequency</th>
                  <th className={erpTableThClassName}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                    <td className={`${erpTableTdClassName} font-semibold text-slate-900`}>
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                        {row.actName}
                      </span>
                    </td>
                    <td className={`${erpTableTdClassName} font-mono text-xs`}>{row.code}</td>
                    <td className={erpTableTdClassName}>{row.frequency}</td>
                    <td className={erpTableTdClassName}>
                      <StatusBadge tone={complianceStatusTone(row.status)}>{row.status}</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CrudCard>
    </StandardPageLayout>
  );
}
