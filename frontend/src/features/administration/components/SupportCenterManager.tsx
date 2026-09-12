"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AdministrationGlobalPageShell } from "@/components/administration/AdministrationGlobalPageShell";
import { ErpDrawerFooter, ErpRowActions } from "@/components/workspace/page-kit";
import { SideDrawer } from "@/components/ui/side-drawer";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { appApi } from "@/services/modules/app";
import { mapHelpdeskTicket, useHelpdeskTickets } from "@/features/administration/hooks/useHelpdeskTickets";

export function SupportCenterManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    description: "",
    priority: "Medium",
    category: "General",
  });
  const { data, isLoading, isError, error, refetch } = useHelpdeskTickets(1, 50);

  const tickets = useMemo(() => (data?.tickets ?? []).map(mapHelpdeskTicket), [data?.tickets]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tickets.filter((t) => {
      const matchesSearch =
        !q || t.subject.toLowerCase().includes(q) || t.ticketNumber.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || t.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [tickets, search, statusFilter]);

  const createTicket = useMutation({
    mutationFn: () =>
      appApi.helpdesk.tickets.create({
        subject: form.subject.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        category: form.category,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["helpdesk", "tickets"] });
    },
  });

  const updateTicket = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      appApi.helpdesk.tickets.update(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["helpdesk", "tickets"] });
    },
  });

  const save = async () => {
    if (!form.subject.trim()) {
      notifyError("Subject is required.");
      return;
    }
    try {
      await createTicket.mutateAsync();
      notifySuccess("Ticket created.");
      setDrawerOpen(false);
      setForm({ subject: "", description: "", priority: "Medium", category: "General" });
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create ticket."));
    }
  };

  return (
    <>
      <AdministrationGlobalPageShell
        title="Support center"
        categoryTag="Platform"
        icon="help-circle"
        kpiMetrics={[
          { label: "Open", value: tickets.filter((t) => t.status !== "Resolved").length, tone: "warning" },
          { label: "Resolved", value: tickets.filter((t) => t.status === "Resolved").length, tone: "positive" },
          { label: "Total", value: data?.total ?? tickets.length, tone: "info" },
        ]}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search ticket ID or subject…"
        filterOptions={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "All", value: "all" },
              { label: "Open", value: "open" },
              { label: "In Progress", value: "in progress" },
              { label: "Resolved", value: "resolved" },
            ],
          },
        ]}
        primaryActionLabel="New ticket"
        onPrimaryAction={() => setDrawerOpen(true)}
        onRefresh={() => void refetch()}
        isLoading={isLoading}
        listKey="platform-support-tickets"
        listRows={filtered}
        getRowId={(row) => row.id}
        emptyMessage="No support tickets yet."
        listColumns={[
          { key: "ticketNumber", label: "Ticket", dataType: "string" },
          { key: "subject", label: "Subject", dataType: "string" },
          { key: "priority", label: "Priority", dataType: "string" },
          { key: "status", label: "Status", dataType: "string" },
          { key: "actions", label: "Actions", locked: true },
        ]}
        renderListRow={(t) => (
          <>
            <td className="erp-td font-mono text-xs">{t.ticketNumber}</td>
            <td className="erp-td text-xs font-semibold">{t.subject}</td>
            <td className="erp-td text-xs">{t.priority}</td>
            <td className="erp-td">
              <span className={t.status === "Resolved" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>{t.status}</span>
            </td>
            <td className="erp-td text-right">
              <ErpRowActions
                extra={
                  t.status !== "Resolved" ? (
                    <button
                      type="button"
                      className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                      disabled={updateTicket.isPending}
                      onClick={() =>
                        void updateTicket
                          .mutateAsync({ id: t.id, status: "Resolved" })
                          .then(() => notifySuccess("Ticket resolved."))
                          .catch((err) => notifyError(getApiErrorMessage(err, "Update failed.")))
                      }
                    >
                      Resolve
                    </button>
                  ) : null
                }
              />
            </td>
          </>
        )}
      >
        {isError ? <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load tickets.")}</div> : null}
      </AdministrationGlobalPageShell>

      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="New support ticket">
        <div className="erp-form-grid">
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Subject *</label>
            <input className="erp-input" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
          </div>
          <div className="erp-field">
            <label className="erp-label">Priority</label>
            <select className="erp-input" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
          <div className="erp-field">
            <label className="erp-label">Category</label>
            <input className="erp-input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Description</label>
            <textarea className="erp-input min-h-24" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <ErpDrawerFooter onCancel={() => setDrawerOpen(false)} onSave={() => void save()} saving={createTicket.isPending} saveLabel="Create ticket" />
          </div>
        </div>
      </SideDrawer>
    </>
  );
}
