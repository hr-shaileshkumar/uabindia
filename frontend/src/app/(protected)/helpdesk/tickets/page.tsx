"use client";

import { useEffect, useState, useCallback } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type TicketRow = { id: string; subject: string; requester: string; category: string; priority: string; assignedTo: string; status: string };

export default function HelpdeskTicketsPage() {
  const [records, setRecords] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await hrApi.helpdesk.tickets.list();
      setRecords((res.data?.records ?? res.data?.tickets ?? []) as TicketRow[]);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load tickets");
      setLoadError(msg);
      notifyError(msg, "Helpdesk Tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  return (
    <ModuleTablePage
      title="Support Tickets"
      subtitle="View and manage all internal support requests, assign agents, and track resolution status."
      eyebrow="Helpdesk / Tickets"
      icon="ticket"
      toolbarTitle="Ticket queue"
      toolbarSubtitle="Assign, respond, and resolve employee support requests with SLA tracking."
      loading={loading}
      loadError={loadError}
      onRetry={loadData}
      rows={records}
      countLabel={(count) => `${count} tickets`}
      emptyMessage="No tickets found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All tickets</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Open</p><p className="erp-kpi-value">{records.filter(r => r.status === "Open").length}</p><p className="erp-kpi-meta">Awaiting action</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">In Progress</p><p className="erp-kpi-value">{records.filter(r => r.status === "In Progress").length}</p><p className="erp-kpi-meta">Being worked on</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Resolved</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Resolved").length}</p><p className="erp-kpi-meta">Closed</p></div>
        </div>
      }
      columns={[{ label: "Subject" }, { label: "Requester" }, { label: "Category" }, { label: "Priority" }, { label: "Assigned To" }, { label: "Status" }]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.subject}</td>
          <td className="erp-td text-slate-600">{r.requester}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-neutral">{r.category}</span></td>
          <td className="erp-td"><span className={`erp-chip ${r.priority === "High" ? "erp-chip-danger" : r.priority === "Medium" ? "erp-chip-warning" : "erp-chip-info"}`}>{r.priority}</span></td>
          <td className="erp-td text-slate-600">{r.assignedTo || "Unassigned"}</td>
          <td className="erp-td"><span className={`erp-chip ${r.status === "Resolved" ? "erp-chip-success" : r.status === "In Progress" ? "erp-chip-info" : "erp-chip-warning"}`}>{r.status}</span></td>
        </tr>
      )}
    />
  );
}
