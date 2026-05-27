"use client";

import { useState } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";

type TemplateRow = {
  id: string;
  name: string;
  channel: "Email" | "SMS" | "InApp";
  event: string;
  language: string;
  status: string;
};

export default function NotificationTemplatesPage() {
  const [records] = useState<TemplateRow[]>([]);

  return (
    <ModuleTablePage
      title="Notification Templates"
      subtitle="Create and manage email, SMS, and in-app notification templates for system events."
      eyebrow="Platform / Configuration"
      icon="bell"
      toolbarTitle="Template library"
      toolbarSubtitle="Manage reusable notification templates with variable substitution for all ERP events."
      loading={false}
      rows={records}
      countLabel={(count) => `${count} templates`}
      emptyMessage="No notification templates found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All templates</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Email</p><p className="erp-kpi-value">{records.filter(r => r.channel === "Email").length}</p><p className="erp-kpi-meta">Email templates</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">SMS</p><p className="erp-kpi-value">{records.filter(r => r.channel === "SMS").length}</p><p className="erp-kpi-meta">SMS templates</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">In-App</p><p className="erp-kpi-value">{records.filter(r => r.channel === "InApp").length}</p><p className="erp-kpi-meta">Push notifications</p></div>
        </div>
      }
      columns={[
        { label: "Template Name" },
        { label: "Channel" },
        { label: "Event" },
        { label: "Language" },
        { label: "Status" },
      ]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.name}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-neutral">{r.channel}</span></td>
          <td className="erp-td text-slate-600">{r.event}</td>
          <td className="erp-td text-slate-600">{r.language}</td>
          <td className="erp-td"><span className={`erp-chip ${r.status === "Active" ? "erp-chip-success" : "erp-chip-warning"}`}>{r.status}</span></td>
        </tr>
      )}
    />
  );
}
