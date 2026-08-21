"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import { EmptyState } from "@/components/erp/empty-state";
import { StatusBadge } from "@/components/erp/status-badge";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpPanelClassName,
  erpTableTdClassName,
  erpTableThClassName,
} from "@/components/erp/erpStyles";
import { getApiErrorMessage } from "@/lib/api-errors";
import { mapHelpdeskTicket, useHelpdeskTickets } from "@/features/platform/hooks/useHelpdeskTickets";

const priorityTone = (priority: string) => {
  if (priority === "High") return "danger" as const;
  if (priority === "Medium") return "warning" as const;
  return "info" as const;
};

const ticketStatusTone = (status: string) => {
  if (status === "Resolved") return "positive" as const;
  if (status === "In Progress") return "info" as const;
  return "warning" as const;
};

export function SupportCenterManager() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, error, refetch } = useHelpdeskTickets(1, 50);

  const tickets = useMemo(() => (data?.tickets ?? []).map(mapHelpdeskTicket), [data?.tickets]);

  const filtered = tickets.filter(
    (t) =>
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.ticketNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <StandardPageLayout
      title="Support Center & Knowledge Base"
      subtitle="Manage customer support tickets, knowledge articles, release notes, and SLA resolution queues."
      eyebrow="Platform"
      icon="help-circle"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Open", value: tickets.filter((t) => t.status !== "Resolved").length, tone: "warning" },
            { label: "Resolved", value: tickets.filter((t) => t.status === "Resolved").length, tone: "positive" },
            { label: "Total", value: data?.total ?? tickets.length, tone: "info" },
          ]}
        />
      }
      actions={
        <>
          <button type="button" className={`${erpButtonClassName.primary} gap-1.5`} disabled>
            <Plus className="h-4 w-4" />
            Create Ticket
          </button>
          <button type="button" onClick={() => void refetch()} className={erpButtonClassName.secondary}>
            Refresh
          </button>
        </>
      }
      filters={
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket ID or subject…"
            className={`${erpFormInputClassName} pl-9`}
          />
        </div>
      }
    >
      {isError && (
        <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load support tickets.")}</div>
      )}

      <CrudCard title="Support ticket queue" description="Live helpdesk tickets from the platform API.">
        {isLoading ? (
          <div className="erp-loading">Loading tickets…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No support tickets found"
            description="Support tickets will appear here once customers or employees raise requests through the helpdesk."
            ctaLabel="Refresh list"
            onClick={() => void refetch()}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className={erpTableThClassName}>Ticket</th>
                  <th className={erpTableThClassName}>Subject</th>
                  <th className={erpTableThClassName}>Priority</th>
                  <th className={erpTableThClassName}>Status</th>
                  <th className={erpTableThClassName}>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className={`${erpTableTdClassName} font-mono text-xs font-semibold text-slate-900`}>{t.ticketNumber}</td>
                    <td className={erpTableTdClassName}>{t.subject}</td>
                    <td className={erpTableTdClassName}>
                      <StatusBadge tone={priorityTone(t.priority)}>{t.priority}</StatusBadge>
                    </td>
                    <td className={erpTableTdClassName}>
                      <StatusBadge tone={ticketStatusTone(t.status)}>{t.status}</StatusBadge>
                    </td>
                    <td className={`${erpTableTdClassName} text-xs text-slate-500`}>{t.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CrudCard>
    </StandardPageLayout>
  );
}
