"use client";

import { useEffect, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { hrApi } from "@/services/hrApi";

type PayrollRun = {
  id: string;
  runDate?: string;
  status?: string;
};

export default function PayrollRunsPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        setLoading(true);
        const res = await hrApi.payroll.runs.list();
        setRuns(Array.isArray(res.data) ? res.data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load payroll runs");
      } finally {
        setLoading(false);
      }
    };

    void fetchRuns();
  }, []);

  return (
    <ModuleTablePage
      title="Payroll Runs"
      subtitle="Track payroll processing cycles."
      eyebrow="Payroll / Processing"
      icon="payroll"
      toolbarTitle="Run ledger"
      toolbarSubtitle="Review configured payroll cycles, processing dates, and run state in a single control table."
      loading={loading}
      error={error}
      rows={runs}
      countLabel={(count) => `${count} runs`}
      emptyMessage="No payroll runs found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Runs</p><p className="erp-kpi-value">{runs.length}</p><p className="erp-kpi-meta">All payroll cycles</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Completed</p><p className="erp-kpi-value erp-kpi-value-success">{runs.filter(r => (r.status || '').toLowerCase() === 'completed').length}</p><p className="erp-kpi-meta">Processed runs</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending</p><p className="erp-kpi-value">{runs.filter(r => !r.status || (r.status || '').toLowerCase() === 'pending').length}</p><p className="erp-kpi-meta">Awaiting processing</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Other Status</p><p className="erp-kpi-value">{runs.filter(r => r.status && !['completed','pending'].includes((r.status || '').toLowerCase())).length}</p><p className="erp-kpi-meta">In-progress / errors</p></div>
        </div>
      }
      columns={[
        { label: "Run" },
        { label: "Period" },
        { label: "Status" },
      ]}
      renderRow={(run) => (
        <tr key={run.id} className="erp-tr">
          <td className="erp-td text-slate-900">{run.id}</td>
          <td className="erp-td text-slate-600">{run.runDate ? new Date(run.runDate).toLocaleDateString() : "-"}</td>
          <td className="erp-td text-slate-600">{run.status || "Pending"}</td>
        </tr>
      )}
    />
  );
}
