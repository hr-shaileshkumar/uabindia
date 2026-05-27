"use client";

import { useEffect, useState, useCallback } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type EscalationRow = { id: string; ticketRef: string; reason: string; escalatedTo: string; escalatedAt: string; slaBreached: boolean; status: string };

export default function HelpdeskEscalationsPage() {
  const [records, setRecords] = useState<EscalationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await hrApi.helpdesk.escalations.list();
      setRecords((res.data?.records ?? res.data?.escalations ?? []) as EscalationRow[]);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load escalations");
      setLoadError(msg);
      notifyError(msg, "Escalations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  return (
    <ModuleTablePage
      title="Escalations"
      subtitle="Manage tickets that have been escalated due to SLA breach, urgency, or complexity."
      eyebrow="Helpdesk / Escalations"
      icon="alert"
      toolbarTitle="Escalation tracker"
      toolbarSubtitle="Review priority escalations and ensure timely resolution to maintain SLA compliance."
      loading={loading}
      loadError={loadError}
      onRetry={loadData}
      rows={records}
      countLabel={(count) => `${count} escalations`}
      emptyMessage="No escalations found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All escalations</p></div>
          <div className="erp-kpi-card erp-kpi-card-danger"><p className="erp-kpi-label">SLA Breached</p><p className="erp-kpi-value">{records.filter(r => r.slaBreached).length}</p><p className="erp-kpi-meta">Needs immediate action</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Open</p><p className="erp-kpi-value">{records.filter(r => r.status === "Open").length}</p><p className="erp-kpi-meta">Still active</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Resolved</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Resolved").length}</p><p className="erp-kpi-meta">Closed</p></div>
        </div>
      }
      columns={[{ label: "Ticket Ref" }, { label: "Reason" }, { label: "Escalated To" }, { label: "Escalated At" }, { label: "SLA" }, { label: "Status" }]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.ticketRef}</td>
          <td className="erp-td text-slate-600">{r.reason}</td>
          <td className="erp-td text-slate-600">{r.escalatedTo}</td>
          <td className="erp-td text-slate-600 text-xs">{r.escalatedAt}</td>
          <td className="erp-td"><span className={`erp-chip ${r.slaBreached ? "erp-chip-danger" : "erp-chip-success"}`}>{r.slaBreached ? "Breached" : "OK"}</span></td>
          <td className="erp-td"><span className={`erp-chip ${r.status === "Resolved" ? "erp-chip-success" : "erp-chip-warning"}`}>{r.status}</span></td>
        </tr>
      )}
    />
  );
}
