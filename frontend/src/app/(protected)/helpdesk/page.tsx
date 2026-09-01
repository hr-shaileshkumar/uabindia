"use client";

import { useMemo } from "react";
import Link from "next/link";
import { BookOpen, LifeBuoy, Ticket } from "lucide-react";
import { ModuleWorkspaceHub } from "@/components/workspace/module-workspace-hub";
import {
  erpPanelBodyClassName,
  erpPanelClassName,
  erpPanelHeaderClassName,
  erpPanelTitleClassName,
} from "@/components/workspace/styles";
import { ROUTES } from "@/constants/routes";
import { mapHelpdeskTicket, useHelpdeskTickets } from "@/features/platform/hooks/useHelpdeskTickets";
import { getApiErrorMessage } from "@/lib/api-errors";

const LINKS = [
  { href: ROUTES.HELPDESK_TICKETS, label: "Tickets", icon: Ticket, desc: "Intake, assignment, and resolution queue" },
  { href: ROUTES.HELPDESK_ESCALATIONS, label: "Escalations", icon: LifeBuoy, desc: "SLA breaches and priority lifts" },
  { href: ROUTES.HELPDESK_FAQ, label: "Knowledge base", icon: BookOpen, desc: "FAQs and service articles" },
];

export default function HelpdeskHomePage() {
  const { data, isLoading, isError, error } = useHelpdeskTickets(1, 50);
  const tickets = useMemo(() => (data?.tickets ?? []).map(mapHelpdeskTicket), [data?.tickets]);
  const open = tickets.filter((ticket) => ticket.status !== "Resolved").length;

  return (
    <ModuleWorkspaceHub
      title="Helpdesk"
      subtitle="Service intake, SLA visibility, escalations, and the knowledge base."
      eyebrow="Operations"
      icon="ticket"
      loading={isLoading}
      error={isError ? getApiErrorMessage(error, "Could not load tickets.") : null}
      links={LINKS}
      linksTitle="Service desk"
      stats={[
        { label: "Tickets", value: tickets.length, helper: "Loaded", href: ROUTES.HELPDESK_TICKETS, icon: Ticket },
        { label: "Open", value: open, helper: "In queue", href: ROUTES.HELPDESK_TICKETS, icon: LifeBuoy },
        { label: "Resolved", value: tickets.length - open, helper: "Closed", href: ROUTES.HELPDESK_TICKETS, icon: Ticket },
        { label: "FAQ", value: "Browse", helper: "Self-help", href: ROUTES.HELPDESK_FAQ, icon: BookOpen },
      ]}
    >
      <section className={erpPanelClassName}>
        <div className={erpPanelHeaderClassName}>
          <h2 className={erpPanelTitleClassName}>Open queue</h2>
          <Link href={ROUTES.HELPDESK_TICKETS} className="text-xs font-semibold text-slate-700 hover:text-slate-900">
            Work tickets
          </Link>
        </div>
        <div className={`${erpPanelBodyClassName} space-y-2 text-sm`}>
          {isLoading ? (
            <p className="text-slate-500">Loading…</p>
          ) : tickets.filter((ticket) => ticket.status !== "Resolved").slice(0, 6).length === 0 ? (
            <p className="text-slate-500">No open tickets.</p>
          ) : (
            tickets
              .filter((ticket) => ticket.status !== "Resolved")
              .slice(0, 6)
              .map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                  <span className="truncate font-medium text-slate-800">{ticket.subject}</span>
                  <span className="text-xs text-slate-500">{ticket.priority}</span>
                </div>
              ))
          )}
        </div>
      </section>
    </ModuleWorkspaceHub>
  );
}
