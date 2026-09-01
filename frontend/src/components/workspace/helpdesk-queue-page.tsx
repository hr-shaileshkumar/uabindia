"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import {
  ErpCreateButton,
  ErpDrawerFooter,
  ErpRefreshButton,
} from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { SideDrawer } from "@/components/ui/side-drawer";
import {
  erpFormInputClassName,
  erpFormLabelClassName,
} from "@/components/workspace/styles";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { appApi } from "@/services/modules";

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
  open: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-700",
  "in progress": "bg-slate-200 text-slate-800",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
};

const priorityClassName: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-slate-200 text-slate-800",
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    description: "",
    category: "General",
    priority: "Medium",
  });

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await appApi.helpdesk.tickets.list({ page: 1, limit: 50 });
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

  const handleCreate = async () => {
    if (form.subject.trim().length < 3 || form.description.trim().length < 5) {
      notifyError("Subject (3+) and description (5+) are required.");
      return;
    }
    try {
      setSaving(true);
      await appApi.helpdesk.tickets.create({
        subject: form.subject.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
      });
      notifySuccess("Ticket created.");
      setDrawerOpen(false);
      setForm({ subject: "", description: "", category: "General", priority: "Medium" });
      void loadTickets();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create ticket."));
    } finally {
      setSaving(false);
    }
  };

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

  const list = useErpListView({
    listKey: "helpdesk-tickets",
    rows: filteredTickets,
    columns: [
      { key: "title", label: "Ticket" },
      { key: "requester", label: "Requester" },
      { key: "priority", label: "Priority" },
      { key: "status", label: "Status" },
      { key: "assignedTo", label: "Owner" },
      { key: "updatedAt", label: "Updated", dataType: "date" },
    ],
    getRowId: (row) => row.id,
    loading,
    emptyMessage: "No tickets match the current filter set. Try a broader search, switch status, or create a ticket.",
    onCreate: () => setDrawerOpen(true),
    createLabel: "New ticket",
    onRefresh: () => void loadTickets(),
    extraFilters: (
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
    ),
    renderRow: (ticket) => (
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
    ),
  });

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
        <>
          <ErpRefreshButton onClick={() => void loadTickets()} loading={loading} />
          {list.headerTools}
          <ErpCreateButton label="New ticket" onClick={() => setDrawerOpen(true)} />
        </>
      }
      filters={list.filterBar}
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <CrudCard>{list.table}</CrudCard>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New helpdesk ticket"
        subtitle="Creates /api/v1/helpdesk/tickets"
        footer={
          <ErpDrawerFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={() => void handleCreate()}
            saving={saving}
            saveLabel="Create ticket"
          />
        }
      >
        <div className="space-y-4">
          <div>
            <label className={erpFormLabelClassName}>Subject *</label>
            <input className={`${erpFormInputClassName} mt-1`} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div>
            <label className={erpFormLabelClassName}>Description *</label>
            <textarea className={`${erpFormInputClassName} mt-1`} rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={erpFormLabelClassName}>Category</label>
              <input className={`${erpFormInputClassName} mt-1`} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <label className={erpFormLabelClassName}>Priority</label>
              <select className={`${erpFormInputClassName} mt-1`} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {["Low", "Medium", "High", "Critical"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}
