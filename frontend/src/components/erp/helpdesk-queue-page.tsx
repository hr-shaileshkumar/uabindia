"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { getApiErrorMessage } from "@/lib/api-errors";
import { hrApi } from "@/services/hrApi";

type TicketRecord = {
  id: string;
  ticketNumber?: string;
  title: string;
  requester: string;
  priority: string;
  status: string;
  category?: string;
  assignedTo?: string;
  updatedAt?: string;
};

const statusClassName: Record<string, string> = {
  open: "bg-sky-100 text-sky-700",
  pending: "bg-amber-100 text-amber-700",
  "in progress": "bg-indigo-100 text-indigo-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
};

const priorityClassName: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-sky-100 text-sky-700",
  high: "bg-amber-100 text-amber-700",
  critical: "bg-rose-100 text-rose-700",
};

const toTitleCase = (value: string) =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const formatDate = (value?: string) => {
  if (!value) return "Not updated";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

export function HelpdeskQueuePage() {
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await hrApi.helpdesk.tickets.list({ page: 1, limit: 50 });
      const raw = response.data;
      const items = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.tickets)
          ? raw.tickets
          : Array.isArray(raw?.records)
            ? raw.records
            : Array.isArray(raw?.data)
              ? raw.data
              : [];

      setTickets(
        items.map((item: Record<string, unknown>, index: number) => {
          const rawStatus = typeof item.status === "string" ? item.status : "open";
          const rawPriority = typeof item.priority === "string" ? item.priority : "medium";

          return {
            id: String(item.id ?? item.ticketId ?? index),
            ticketNumber: typeof item.ticketNumber === "string" ? item.ticketNumber : undefined,
            title:
              typeof item.subject === "string"
                ? item.subject
                : typeof item.title === "string"
                  ? item.title
                  : "Untitled ticket",
            requester:
              typeof item.requesterName === "string"
                ? item.requesterName
                : typeof item.createdByName === "string"
                  ? item.createdByName
                  : typeof item.employeeName === "string"
                    ? item.employeeName
                    : "Unknown requester",
            priority: toTitleCase(rawPriority),
            status: toTitleCase(rawStatus),
            category: typeof item.category === "string" ? item.category : undefined,
            assignedTo:
              typeof item.assignedToName === "string"
                ? item.assignedToName
                : typeof item.assignedTo === "string"
                  ? item.assignedTo
                  : undefined,
            updatedAt:
              typeof item.updatedAt === "string"
                ? item.updatedAt
                : typeof item.createdAt === "string"
                  ? item.createdAt
                  : undefined,
          };
        })
      );
    } catch (loadError: unknown) {
      setError(getApiErrorMessage(loadError, "Failed to load helpdesk tickets."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const filteredTickets = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === "all" || ticket.status.toLowerCase() === statusFilter;
      const matchesSearch =
        !keyword ||
        ticket.title.toLowerCase().includes(keyword) ||
        ticket.requester.toLowerCase().includes(keyword) ||
        (ticket.ticketNumber || "").toLowerCase().includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [search, statusFilter, tickets]);

  return (
    <StandardPageLayout
      title="Helpdesk Queue"
      subtitle="Review support intake, filter active issues, and keep service response work visible in one queue."
      eyebrow="Helpdesk / Tickets"
      icon="ticket"
      actions={
        <button type="button" onClick={() => void loadTickets()} className="erp-action-btn erp-action-btn-secondary">
          Refresh queue
        </button>
      }
      filters={
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_12rem]">
          <div>
            <label className="erp-label">Search tickets</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ticket number, title, or requester"
              className="erp-input"
            />
          </div>
          <div>
            <label className="erp-label">Status</label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="erp-select">
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="in progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      }
    >
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Visible Tickets</p>
          <p className="erp-kpi-value">{filteredTickets.length}</p>
          <p className="erp-kpi-meta">Current search and status scope</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-warning">
          <p className="erp-kpi-label">Open / Pending</p>
          <p className="erp-kpi-value">
            {filteredTickets.filter((ticket) => ["Open", "Pending"].includes(ticket.status)).length}
          </p>
          <p className="erp-kpi-meta">Still needs active handling</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-danger">
          <p className="erp-kpi-label">High Priority</p>
          <p className="erp-kpi-value erp-kpi-value-danger">
            {filteredTickets.filter((ticket) => ["High", "Critical"].includes(ticket.priority)).length}
          </p>
          <p className="erp-kpi-meta">Escalation attention items</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Resolved</p>
          <p className="erp-kpi-value erp-kpi-value-success">
            {filteredTickets.filter((ticket) => ticket.status === "Resolved").length}
          </p>
          <p className="erp-kpi-meta">Tickets already closed out</p>
        </div>
      </div>

      {error ? <div className="erp-alert-error">{error}</div> : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Ticket</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Requester</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td colSpan={6} className="px-5 py-4">
                    <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
                  </td>
                </tr>
              ))
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                  No tickets match the current filter set.
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="transition hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-900">{ticket.title}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {ticket.ticketNumber || "No ticket number"}
                      {ticket.category ? ` | ${ticket.category}` : ""}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{ticket.requester}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        priorityClassName[ticket.priority.toLowerCase()] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        statusClassName[ticket.status.toLowerCase()] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{ticket.assignedTo || "Unassigned"}</td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(ticket.updatedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </StandardPageLayout>
  );
}
