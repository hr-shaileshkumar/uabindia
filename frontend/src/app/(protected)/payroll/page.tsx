"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { useUiSchema } from "@/context/UiSchemaContext";
import { ROUTES } from "@/constants/routes";

type PayrollRunSummary = {
  id: string;
  runDate?: string;
  status?: string;
};

type PayrollSummary = {
  runs: PayrollRunSummary[];
  total: number;
};

export default function PayrollDashboardPage() {
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { navigation } = useUiSchema();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await hrApi.payroll.runs.list();
        const runs = Array.isArray(res.data) ? res.data : [];
        setSummary({ runs, total: runs.length });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load payroll summary");
      } finally {
        setLoading(false);
      }
    };

    void fetchSummary();
  }, []);

  const runs = summary?.runs ?? [];
  const processedRuns = runs.filter((run) => ["processed", "completed", "closed"].includes(String(run.status || "").toLowerCase())).length;
  const pendingRuns = Math.max(0, runs.length - processedRuns);
  const latestRun = runs[0];

  const fallbackTiles = [
    { href: ROUTES.PAYROLL_STRUCTURES, title: "Structures", description: "Maintain salary structures and grade-aligned pay templates.", icon: "🏗️", meta: "Master setup" },
    { href: ROUTES.PAYROLL_COMPONENTS, title: "Components", description: "Configure earnings, deductions, and statutory components.", icon: "🧩", meta: "Payroll engine" },
    { href: ROUTES.PAYROLL_STATUTORY, title: "Statutory", description: "Track PF, ESI, PT, and tax compliance artifacts.", icon: "📘", meta: "Compliance" },
  ];

  const schemaTiles = navigation.modules
    .find((module) => module.key === "payroll")
    ?.groups
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((group) =>
      group.items
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => ({
          href: item.path,
          title: item.name,
          description: `Open ${item.name} workspace.`,
          icon: "💼",
          meta: group.label,
        }))
    )
    .slice(0, 3);

  const quickTiles = schemaTiles && schemaTiles.length > 0 ? schemaTiles : fallbackTiles;
  const runsHref = quickTiles[0]?.href || ROUTES.PAYROLL_RUNS;
  const payslipsHref = quickTiles[1]?.href || ROUTES.PAYROLL_PAYSLIPS;

  return (
    <StandardPageLayout
      title="Payroll Dashboard"
      subtitle="Operational visibility into payroll cycles, payouts, and statutory readiness."
      actions={
        <>
          <Link href={runsHref} className="erp-action-btn erp-action-btn-secondary">Payroll Runs</Link>
          <Link href={payslipsHref} className="erp-action-btn erp-action-btn-primary">Open Payslips</Link>
        </>
      }
    >
      {loading ? <div className="erp-panel erp-loading">Loading payroll summary...</div> : null}
      {error ? <div className="erp-alert-error">Error: {error}</div> : null}

      {!loading && !error ? (
        <div className="space-y-6">
          <div className="erp-kpi-grid">
            <div className="erp-kpi-card"><p className="erp-kpi-label">Total Runs</p><p className="erp-kpi-value">{runs.length}</p><p className="erp-kpi-meta">Configured processing cycles</p></div>
            <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Processed</p><p className="erp-kpi-value erp-kpi-value-success">{processedRuns}</p><p className="erp-kpi-meta">Completed successfully</p></div>
            <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending</p><p className="erp-kpi-value">{pendingRuns}</p><p className="erp-kpi-meta">Awaiting action or approval</p></div>
            <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Latest Run</p><p className="erp-kpi-value">{latestRun?.status || "—"}</p><p className="erp-kpi-meta">{latestRun?.runDate ? new Date(latestRun.runDate).toLocaleDateString() : "No run executed yet"}</p></div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Payroll Runs</CardTitle>
            </CardHeader>
            <CardContent>
              {runs.length ? (
                <ul className="space-y-3 text-sm">
                  {runs.map((run) => (
                    <li key={run.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white/70 px-4 py-3">
                      <span className="font-medium text-slate-900">{run.runDate ? new Date(run.runDate).toLocaleDateString() : "Payroll Run"}</span>
                      <span className="text-slate-600">{run.status || "Pending"}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600">No payroll runs available.</p>
              )}
            </CardContent>
          </Card>

          <div className="erp-tile-grid">
            {quickTiles.map((tile) => (
              <Link key={tile.href} href={tile.href} className="erp-tile">
                <span className="erp-tile-icon">{tile.icon}</span>
                <div className="erp-tile-title">{tile.title}</div>
                <p className="erp-tile-desc">{tile.description}</p>
                <div className="erp-tile-meta">{tile.meta}</div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </StandardPageLayout>
  );
}
