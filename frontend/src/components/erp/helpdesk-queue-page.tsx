"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
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

  const activeTickets = filteredTickets.filter((ticket) => ["Open", "Pending"].includes(ticket.status)).length;
  const urgentTickets = filteredTickets.filter((ticket) => ["High", "Critical"].includes(ticket.priority)).length;
  const resolvedTickets = filteredTickets.filter((ticket) => ticket.status === "Resolved").length;

  return (
    <StandardPageLayout
      title="Helpdesk Queue"
      subtitle="Review support intake, filter active issues, and keep service response work visible in one queue."
      eyebrow="Helpdesk / Tickets"
      icon="ticket"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Tickets", value: filteredTickets.length, helper: "visible" },
            { label: "Active", value: activeTickets, tone: "warning" },
            { label: "Urgent", value: urgentTickets, tone: "danger" },
            { label: "Resolved", value: resolvedTickets, tone: "positive" },
          ]}
        />
      }
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
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <div className="erp-table-wrap">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Ticket</th>
              <th className="erp-th">Requester</th>
              <th className="erp-th">Priority</th>
              <th className="erp-th">Status</th>
              <th className="erp-th">Owner</th>
              <th className="erp-th">Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td colSpan={6} className="erp-td">
                    <div className="h-4 animate-pulse rounded bg-slate-100" aria-hidden="true" />
                  </td>
                </tr>
              ))
            ) : filteredTickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="erp-td py-10 text-center">
                  <div className="mx-auto flex max-w-lg flex-col items-center gap-2 text-center" role="status">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500" aria-hidden="true">
                      <Inbox className="h-4 w-4" />
                    </span>
                    <p className="text-sm font-semibold text-slate-900">No tickets match the current filter set.</p>
                    <p className="text-sm leading-6 text-slate-500">Try a broader search or switch to a different status bucket.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="erp-tr">
                  <td className="erp-td">
                    <div className="font-medium text-slate-900">{ticket.title}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {ticket.ticketNumber || "No ticket number"}
                      {ticket.category ? ` | ${ticket.category}` : ""}
                    </div>
                  </td>
                  <td className="erp-td text-slate-600">{ticket.requester}</td>
                  <td className="erp-td">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        priorityClassName[ticket.priority.toLowerCase()] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="erp-td">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        statusClassName[ticket.status.toLowerCase()] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td className="erp-td text-slate-600">{ticket.assignedTo || "Unassigned"}</td>
                  <td className="erp-td text-slate-600">{formatDate(ticket.updatedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </StandardPageLayout>
  );
}
