"use client";

import { useEffect, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { hrApi } from "@/services/hrApi";

type StatutoryRow = {
  id: string;
  type: string;
  period: string;
  status: string;
  total: number;
};

export default function PayrollStatutoryPage() {
  const [statutory, setStatutory] = useState<StatutoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatutory = async () => {
      try {
        setLoading(true);
        const [pfRes, esiRes, ptRes, tdsRes] = await Promise.all([
          hrApi.payroll.statutory.pf(),
          hrApi.payroll.statutory.esi(),
          hrApi.payroll.statutory.pt(),
          hrApi.payroll.statutory.tds(),
        ]);

        const normalize = (type: string, data: Record<string, unknown>, totalKey: string): StatutoryRow => ({
          id: type,
          type,
          period: typeof data?.month === "string" ? new Date(data.month).toLocaleDateString() : "-",
          status: Array.isArray(data?.records) && data.records.length ? "Generated" : "Pending",
          total: typeof data?.[totalKey] === "number" ? Number(data[totalKey]) : 0,
        });

        setStatutory([
          normalize("PF", pfRes.data as Record<string, unknown>, "totalPF"),
          normalize("ESI", esiRes.data as Record<string, unknown>, "totalESI"),
          normalize("PT", ptRes.data as Record<string, unknown>, "totalPT"),
          normalize("TDS", tdsRes.data as Record<string, unknown>, "totalTDS"),
        ]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load statutory records");
      } finally {
        setLoading(false);
      }
    };

    void fetchStatutory();
  }, []);

  return (
    <ModuleTablePage
      title="Statutory Compliance"
      subtitle="PF, ESI, PT, and other statutory filings."
      eyebrow="Payroll / Compliance"
      icon="shield"
      toolbarTitle="Compliance register"
      toolbarSubtitle="Track monthly statutory totals, filing status, and period coverage from a single compliance table."
      loading={loading}
      error={error}
      rows={statutory}
      countLabel={(count) => `${count} statutory buckets`}
      emptyMessage="No statutory records found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Filings</p><p className="erp-kpi-value">{statutory.length}</p><p className="erp-kpi-meta">Statutory records</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Filed</p><p className="erp-kpi-value erp-kpi-value-success">{statutory.filter(s => (s.status || '').toLowerCase() === 'filed').length}</p><p className="erp-kpi-meta">Completed filings</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending</p><p className="erp-kpi-value">{statutory.filter(s => (s.status || '').toLowerCase() === 'pending').length}</p><p className="erp-kpi-meta">Awaiting filing</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Total Amount</p><p className="erp-kpi-value">{statutory.reduce((s, r) => s + (r.total || 0), 0).toLocaleString()}</p><p className="erp-kpi-meta">Sum of all amounts</p></div>
        </div>
      }
      columns={[
        { label: "Type" },
        { label: "Period" },
        { label: "Total" },
        { label: "Status" },
      ]}
      renderRow={(item) => (
        <tr key={item.id} className="erp-tr">
          <td className="erp-td text-slate-900">{item.type || "Compliance"}</td>
          <td className="erp-td text-slate-600">{item.period || "-"}</td>
          <td className="erp-td text-slate-900 font-medium">{item.total ?? 0}</td>
          <td className="erp-td text-slate-600">{item.status || "Pending"}</td>
        </tr>
      )}
    />
  );
}
