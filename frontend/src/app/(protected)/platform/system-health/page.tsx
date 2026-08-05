"use client";

import React, { useState } from "react";
import { Activity, Server, Cpu, HardDrive, Database, RefreshCw, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";

interface ServiceHealthRow {
  service: string;
  type: string;
  latencyMs: number;
  uptime: string;
  status: "Operational" | "Degraded" | "Offline";
}

const SEED_SERVICES: ServiceHealthRow[] = [
  { service: "ASP.NET Core Web API (Kestrel Cluster)", type: "API Core", latencyMs: 14, uptime: "99.99%", status: "Operational" },
  { service: "PostgreSQL Multi-Tenant DB", type: "Database", latencyMs: 4, uptime: "100.00%", status: "Operational" },
  { service: "Redis Distributed Cache Cluster", type: "Cache Layer", latencyMs: 1, uptime: "100.00%", status: "Operational" },
  { service: "Next.js App Router Standalone", type: "Frontend Portal", latencyMs: 18, uptime: "99.98%", status: "Operational" },
  { service: "Nginx High-Concurrency Load Balancer", type: "Reverse Proxy", latencyMs: 2, uptime: "100.00%", status: "Operational" },
];

export default function SystemHealthPage() {
  const [services, setServices] = useState<ServiceHealthRow[]>(SEED_SERVICES);
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 600);
  };

  const kpis: KpiMetricItem[] = [
    { label: "Cluster Status", value: "Optimal", tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Healthy" },
    { label: "Avg DB Latency", value: "4ms", tone: "positive", icon: <Database className="h-3.5 w-3.5" />, subtext: "PostgreSQL" },
    { label: "Cache Hit Rate", value: "98.4%", tone: "positive", icon: <Server className="h-3.5 w-3.5" />, subtext: "Redis 7" },
    { label: "Overall Uptime", value: "99.99%", tone: "info", icon: <Activity className="h-3.5 w-3.5" />, subtext: "30 Days" },
  ];

  return (
    <PlatformGlobalPageShell
      title="System Telemetry & Health Monitor"
      subtitle="Real-time status monitor for load balancer nodes, API clusters, database latency, and background job queues."
      categoryTag="Infrastructure Operations"
      kpiMetrics={kpis}
      onRefresh={handleRefresh}
      isLoading={loading}
    >
      <div className="p-6 space-y-6">
        {/* Live Metrics Overview Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
              <span>CPU Utilization</span>
              <Cpu className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">18.4%</div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: "18.4%" }} />
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
              <span>Memory Allocation</span>
              <HardDrive className="h-4 w-4 text-sky-500" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">4.2 GB / 16 GB</div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-sky-500 h-full rounded-full" style={{ width: "26.25%" }} />
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
              <span>Concurrent User Capacity</span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">200,000 Cap</div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: "12%" }} />
            </div>
          </div>
        </div>

        {/* Services Status Table */}
        <div className="erp-table-wrap rounded-lg border">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Subsystem Name</th>
                <th className="erp-th">Layer Type</th>
                <th className="erp-th">Response Latency</th>
                <th className="erp-th">Uptime Score</th>
                <th className="erp-th text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s, idx) => (
                <tr key={idx} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Server className="h-4 w-4 text-indigo-500" />
                    {s.service}
                  </td>
                  <td className="erp-td">
                    <Badge variant="outline" className="text-xs font-normal">
                      {s.type}
                    </Badge>
                  </td>
                  <td className="erp-td font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{s.latencyMs}ms</td>
                  <td className="erp-td font-mono text-xs text-slate-700 dark:text-slate-300">{s.uptime}</td>
                  <td className="erp-td text-right">
                    <span className="erp-chip erp-chip-success">{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PlatformGlobalPageShell>
  );
}
