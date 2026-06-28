"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { moduleWorkspaces } from "@/lib/erp/mock-data";
import { PageHeader } from "@/components/erp/page-header";
import { StatCard } from "@/components/erp/stat-card";
import { FilterBar } from "@/components/erp/filter-bar";
import { DataTable } from "@/components/erp/data-table";
import { ApprovalTimeline } from "@/components/erp/approval-timeline";
import { AuditLogPanel } from "@/components/erp/audit-log-panel";
import { ConfirmDialog } from "@/components/erp/confirm-dialog";
import { StatusBadge } from "@/components/erp/status-badge";

export function WorkspacePage({
  workspaceKey,
  crumbs,
}: {
  workspaceKey: keyof typeof moduleWorkspaces;
  crumbs: Array<{ label: string; href?: string }>;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const config = moduleWorkspaces[workspaceKey];
  const chartData = useMemo(() => config.chart, [config.chart]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        crumbs={crumbs}
        primaryAction={config.primaryAction}
        secondaryAction={config.secondaryAction}
      />

      <div className="grid gap-4 xl:grid-cols-4">
        {config.stats.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </div>

      <FilterBar filters={config.filters} />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">{config.chartTitle}</h3>
              <p className="mt-1 text-sm text-slate-600">Recharts-based module monitoring with responsive enterprise sizing.</p>
            </div>
            <StatusBadge tone="info">Live trend</StatusBadge>
          </div>
          <div className="mt-5 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip cursor={{ fill: "rgba(148,163,184,0.08)" }} />
                <Bar dataKey="value" fill="#0b4f8c" radius={[10, 10, 0, 0]} />
                <Bar dataKey="secondary" fill="#93c5fd" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-950">Design notes</h3>
              <button
                className="text-sm font-semibold text-sky-700"
                onClick={() => setConfirmOpen(true)}
              >
                Open confirm dialog
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {config.focusAreas.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <ApprovalTimeline items={config.timeline} />
        </div>
      </div>

      <DataTable title={config.recordsTitle} description={config.recordsDescription} rows={config.records} />

      <AuditLogPanel items={config.audit} />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Apply bulk action?"
        description="This confirm dialog represents the small modal pattern for approve, reject, delete, and export confirmation workflows."
      />
    </div>
  );
}
