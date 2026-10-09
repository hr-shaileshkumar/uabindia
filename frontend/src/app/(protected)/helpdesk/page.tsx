"use client";

import {
  LifeBuoy,
  Ticket,
  MessageSquare,
  BookOpen,
  ArrowUpCircle,
  BarChart2,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { UabModuleDashboard } from "@/components/dynamic/UabModuleDashboard";

const LINKS = [
  { href: "/helpdesk/tickets", label: "Support Tickets", icon: Ticket, desc: "Customer issues and resolution tracking" },
  { href: "/helpdesk/escalations", label: "Escalations", icon: ArrowUpCircle, desc: "SLA breaches and priority cases" },
  { href: "/helpdesk/faq", label: "FAQ / Knowledge Base", icon: BookOpen, desc: "Self-service knowledge articles" },
];

export default function HelpdeskPage() {
  return (
    <UabModuleDashboard
      moduleKey="helpdesk"
      title="Help Desk & Support"
      subtitle="Customer support tickets, SLA tracking, escalations, and knowledge base."
      eyebrow="Helpdesk"
      icon={LifeBuoy}
      color="from-pink-600 via-rose-600 to-red-600"
      statsEndpoint="/helpdesk/dashboard/stats"
      statsMapper={(data) => [
        { label: "Open Tickets", value: data?.openTickets ?? 0, icon: Ticket, tone: "info" },
        { label: "SLA Breached", value: data?.slaBreached ?? 0, icon: Clock, tone: "negative" },
        { label: "Resolved (MTD)", value: data?.resolvedMTD ?? 0, icon: CheckCircle2, tone: "positive" },
        { label: "Avg Resolution (hrs)", value: data?.avgResolutionHrs ? `${data.avgResolutionHrs}h` : "—", icon: BarChart2, tone: "neutral" },
      ]}
      kpis={[
        { label: "Open Tickets", value: "—", icon: Ticket, tone: "info" },
        { label: "SLA Breached", value: "—", icon: Clock, tone: "negative" },
        { label: "Resolved (MTD)", value: "—", icon: CheckCircle2, tone: "positive" },
        { label: "Avg Resolution", value: "—", icon: BarChart2, tone: "neutral" },
      ]}
      links={LINKS}
      linksTitle="Helpdesk Workspaces"
      activityEndpoint="/helpdesk/activity"
    />
  );
}
