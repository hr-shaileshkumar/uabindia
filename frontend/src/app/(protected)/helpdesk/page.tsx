"use client";

import React, { useState } from "react";
import { Ticket, Plus, Eye, CheckCircle2, Clock, ShieldAlert, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface TicketRow {
  id: string;
  ticketNumber: string;
  subject: string;
  category: "Payroll Query" | "IT Asset" | "Attendance Correction" | "General";
  priority: "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Resolved";
  createdAt: string;
}

const SEED_TICKETS: TicketRow[] = [
  { id: "t_1", ticketNumber: "HD-1092", subject: "July Salary Payslip Tax Deduction Mismatch", category: "Payroll Query", priority: "High", status: "In Progress", createdAt: "2026-08-04 11:20" },
  { id: "t_2", ticketNumber: "HD-1093", subject: "MacBook Pro Charger Replacement Request", category: "IT Asset", priority: "Medium", status: "Open", createdAt: "2026-08-05 09:45" },
  { id: "t_3", ticketNumber: "HD-1088", subject: "Geofence Attendance Punch Issue at Mumbai Hub", category: "Attendance Correction", priority: "High", status: "Resolved", createdAt: "2026-08-02 16:30" },
];

export default function HelpdeskPage() {
  const [tickets] = useState<TicketRow[]>(SEED_TICKETS);
  const [search, setSearch] = useState("");

  const filteredTickets = tickets.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.ticketNumber.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Total Open Tickets", value: tickets.filter((t) => t.status !== "Resolved").length, tone: "warning", icon: <Ticket className="h-3.5 w-3.5" />, subtext: "Support Queue" },
    { label: "SLA Resolution Time", value: "< 4 Hours", tone: "positive", icon: <Clock className="h-3.5 w-3.5" />, subtext: "Met 98.4%" },
    { label: "High Priority Tickets", value: tickets.filter((t) => t.priority === "High").length, tone: "negative", icon: <ShieldAlert className="h-3.5 w-3.5" />, subtext: "Escalated" },
    { label: "Knowledge Base FAQs", value: "48 Articles", tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Self-Service" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Enterprise Service Helpdesk & Support Tickets"
      subtitle="Track employee HR and IT support tickets, SLA resolution deadlines, knowledge base FAQs, and ticket escalation queues."
      categoryTag="Service Operations Helpdesk"
      kpiMetrics={kpis}
      searchPlaceholder="Filter ticket number, subject, or category..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="Raise Support Ticket"
      onPrimaryAction={() => notifySuccess("Support ticket creation modal opened.")}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Ticket ID</th>
              <th className="erp-th">Ticket Subject</th>
              <th className="erp-th">Category</th>
              <th className="erp-th">Priority</th>
              <th className="erp-th">Created At</th>
              <th className="erp-th text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((t) => (
              <tr key={t.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">{t.ticketNumber}</td>
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-indigo-500" />
                  {t.subject}
                </td>
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {t.category}
                  </Badge>
                </td>
                <td className="erp-td font-mono text-xs">
                  <span className={t.priority === "High" ? "text-rose-600 font-bold" : "text-slate-600"}>
                    {t.priority}
                  </span>
                </td>
                <td className="erp-td font-mono text-xs text-slate-500">{t.createdAt}</td>
                <td className="erp-td text-right">
                  <span className={t.status === "Resolved" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
