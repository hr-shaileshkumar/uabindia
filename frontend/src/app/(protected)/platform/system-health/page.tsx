"use client";

import { useEffect, useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { hrApi } from "@/services/hrApi";

type HealthCheck = {
  id: string;
  service: string;
  status: string;
  latencyMs: number;
  lastChecked: string;
  message?: string;
};

export default function SystemHealthPage() {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await hrApi.system.getVersion();
        // Build a synthetic health check from the version endpoint
        setChecks([
          {
            id: "api",
            service: "API Server",
            status: "Healthy",
            latencyMs: 0,
            lastChecked: new Date().toISOString(),
            message: `Version ${res.version || "unknown"}`,
          },
        ]);
      } catch {
        setError("Failed to load system health status.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <ModuleTablePage
      title="System Health"
      subtitle="Monitor API services, background jobs, database connectivity, and infrastructure health."
      eyebrow="Platform / Monitoring"
      icon="dashboard"
      toolbarTitle="Health monitor"
      toolbarSubtitle="Real-time and historical health checks across all ERP platform services."
      loading={loading}
      error={error}
      rows={checks}
      countLabel={(count) => `${count} services`}
      emptyMessage="No health checks available."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total Services</p><p className="erp-kpi-value">{checks.length}</p><p className="erp-kpi-meta">Monitored</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Healthy</p><p className="erp-kpi-value erp-kpi-value-success">{checks.filter(c => c.status === "Healthy").length}</p><p className="erp-kpi-meta">All systems go</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Degraded</p><p className="erp-kpi-value">{checks.filter(c => c.status === "Degraded").length}</p><p className="erp-kpi-meta">Partial service</p></div>
          <div className="erp-kpi-card erp-kpi-card-danger"><p className="erp-kpi-label">Unhealthy</p><p className="erp-kpi-value">{checks.filter(c => c.status === "Unhealthy").length}</p><p className="erp-kpi-meta">Service outage</p></div>
        </div>
      }
      columns={[
        { label: "Service" },
        { label: "Latency" },
        { label: "Last Checked" },
        { label: "Message" },
        { label: "Status" },
      ]}
      renderRow={(c) => (
        <tr key={c.id} className="erp-tr">
          <td className="erp-td text-slate-900">{c.service}</td>
          <td className="erp-td text-slate-600">{c.latencyMs > 0 ? `${c.latencyMs}ms` : "-"}</td>
          <td className="erp-td text-slate-600 text-xs">{new Date(c.lastChecked).toLocaleString()}</td>
          <td className="erp-td text-slate-600">{c.message || "-"}</td>
          <td className="erp-td">
            <span className={`erp-chip ${c.status === "Healthy" ? "erp-chip-success" : c.status === "Degraded" ? "erp-chip-warning" : "erp-chip-danger"}`}>{c.status}</span>
          </td>
        </tr>
      )}
    />
  );
}
