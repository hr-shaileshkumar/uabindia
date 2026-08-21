import { useQuery } from "@tanstack/react-query";
import { appApi } from "@/services/modules/app";
import type { HelpdeskTicketRecord, HelpdeskTicketsResponse } from "@/types";

export const helpdeskTicketsQueryKey = (page: number, limit: number, status?: string) =>
  ["helpdesk", "tickets", page, limit, status ?? "all"] as const;

export const useHelpdeskTickets = (page = 1, limit = 25, status?: string) =>
  useQuery({
    queryKey: helpdeskTicketsQueryKey(page, limit, status),
    queryFn: async () => {
      const { data } = await appApi.helpdesk.tickets.list({ page, limit, status });
      const payload = data as HelpdeskTicketsResponse;
      const tickets = payload.tickets ?? payload.records ?? [];
      return {
        tickets,
        total: payload.total ?? tickets.length,
        page: payload.page ?? page,
        limit: payload.limit ?? limit,
      };
    },
    staleTime: 30_000,
  });

export const mapHelpdeskTicket = (ticket: HelpdeskTicketRecord) => ({
  id: ticket.id,
  ticketNumber: ticket.ticketNumber,
  subject: ticket.subject,
  category: ticket.category ?? "General",
  priority: (ticket.priority ?? "Medium") as "High" | "Medium" | "Low",
  status: normalizeTicketStatus(ticket.status),
  createdAt: formatTicketDate(ticket.createdAt),
});

const normalizeTicketStatus = (status?: string | null): "Open" | "In Progress" | "Resolved" => {
  const value = (status ?? "").toLowerCase();
  if (value.includes("progress")) return "In Progress";
  if (value.includes("resolve") || value.includes("close")) return "Resolved";
  return "Open";
};

const formatTicketDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
