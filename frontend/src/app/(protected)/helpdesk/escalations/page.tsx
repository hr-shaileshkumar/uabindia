"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
﻿
import { useEffect, useState, useCallback } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ListCreateButton, ListSearchInput, ListStatusFilter, ListToolbar } from "@/components/workspace/list-toolbar";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpFormLabelClassName,
} from "@/components/workspace/styles";
import { appApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type EscalationRow = {
  id: string;
  ticketRef: string;
  reason: string;
  escalatedTo: string;
  escalatedAt: string;
  slaBreached: boolean;
  status: string;
};

type TicketOption = { id: string; ticketNumber?: string; subject?: string };

const emptyForm = () => ({ ticketId: "", reason: "", slaBreached: false });

function LegacyHelpdeskEscalationsPage() {
  const [records, setRecords] = useState<EscalationRow[]>([]);
  const [tickets, setTickets] = useState<TicketOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [escRes, ticketRes] = await Promise.all([
        appApi.helpdesk.escalations.list({ limit: 100, status: statusFilter === "all" ? undefined : statusFilter }),
        appApi.helpdesk.tickets.list({ limit: 100 }),
      ]);
      setRecords((escRes.data?.records ?? escRes.data?.escalations ?? []) as EscalationRow[]);
      const ticketList = (ticketRes.data?.tickets ?? ticketRes.data?.records ?? []) as TicketOption[];
      setTickets(ticketList);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load escalations");
      setLoadError(msg);
      notifyError(msg, "Escalations");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (!form.ticketId || form.reason.trim().length < 3) {
      notifyError("Select a ticket and enter a reason (min 3 characters).");
      return;
    }
    try {
      setSaving(true);
      await appApi.helpdesk.escalations.create({
        ticketId: form.ticketId,
        reason: form.reason.trim(),
        slaBreached: form.slaBreached,
        status: "Open",
      });
      notifySuccess("Escalation created.", "Escalations");
      setDrawerOpen(false);
      setForm(emptyForm());
      void loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create escalation."), "Escalations");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.ticketRef.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q) || (r.escalatedTo || "").toLowerCase().includes(q);
  });

  return (
    <>
      <ModuleTablePage
        title="Escalations"
        subtitle="Manage tickets that have been escalated due to SLA breach, urgency, or complexity."
        eyebrow="Helpdesk / Escalations"
        icon="alert"
        toolbarTitle="Escalation tracker"
        toolbarSubtitle="Review priority escalations and ensure timely resolution to maintain SLA compliance."
        loading={loading}
        loadError={loadError}
        onRetry={loadData}
        rows={filtered}
        countLabel={(count) => `${count} escalations`}
        emptyMessage="No escalations found. Escalate an open ticket to start tracking."
        emptyAction={<ListCreateButton label="New escalation" onClick={() => setDrawerOpen(true)} />}
        actions={<ListCreateButton label="New escalation" onClick={() => setDrawerOpen(true)} />}
        filters={
          <ListToolbar
            search={<ListSearchInput value={search} onChange={setSearch} placeholder="Filter ticket, reason…" />}
            filters={
              <ListStatusFilter
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { label: "All statuses", value: "all" },
                  { label: "Open", value: "Open" },
                  { label: "Resolved", value: "Resolved" },
                ]}
              />
            }
          />
        }
        headerStats={
          <CrudHeaderStats
            items={[
              { label: "Escalations", value: records.length, helper: "total" },
              {
                label: "SLA Breached",
                value: records.filter((record) => record.slaBreached).length,
                tone: "danger",
              },
              {
                label: "Open",
                value: records.filter((record) => record.status === "Open").length,
                tone: "warning",
              },
              {
                label: "Resolved",
                value: records.filter((record) => record.status === "Resolved").length,
                tone: "positive",
              },
            ]}
          />
        }
        columns={[{ label: "Ticket Ref" }, { label: "Reason" }, { label: "Escalated To" }, { label: "Escalated At" }, { label: "SLA" }, { label: "Status" }]}
        renderRow={(r) => (
          <tr key={r.id} className="erp-tr">
            <td className="erp-td text-slate-900">{r.ticketRef}</td>
            <td className="erp-td text-slate-600">{r.reason}</td>
            <td className="erp-td text-slate-600">{r.escalatedTo || "—"}</td>
            <td className="erp-td text-slate-600 text-xs">{r.escalatedAt ? new Date(r.escalatedAt).toLocaleString() : "—"}</td>
            <td className="erp-td">
              <span className={`erp-chip ${r.slaBreached ? "erp-chip-danger" : "erp-chip-success"}`}>{r.slaBreached ? "Breached" : "OK"}</span>
            </td>
            <td className="erp-td">
              <span className={`erp-chip ${r.status === "Resolved" ? "erp-chip-success" : "erp-chip-warning"}`}>{r.status}</span>
            </td>
          </tr>
        )}
      />
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New escalation"
        subtitle="Creates /api/v1/helpdesk/escalations and marks the ticket Escalated"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className={erpButtonClassName.secondary} onClick={() => setDrawerOpen(false)}>
              Cancel
            </button>
            <button type="button" className={erpButtonClassName.primary} disabled={saving} onClick={() => void handleCreate()}>
              {saving ? "Saving…" : "Escalate"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={erpFormLabelClassName}>Ticket *</label>
            <select className={`${erpFormInputClassName} mt-1`} value={form.ticketId} onChange={(e) => setForm({ ...form, ticketId: e.target.value })}>
              <option value="">Select ticket…</option>
              {tickets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.ticketNumber ?? t.id.slice(0, 8)} · {t.subject ?? ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={erpFormLabelClassName}>Reason *</label>
            <textarea className={`${erpFormInputClassName} mt-1`} rows={4} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={form.slaBreached} onChange={(e) => setForm({ ...form, slaBreached: e.target.checked })} />
            SLA already breached
          </label>
        </div>
      </SideDrawer>
    </>
  );
}

export default function HelpdeskEscalationsPage() {
  return (
    <DynamicPage
      pageKey="helpdesk.escalations"
      fallback={<LegacyHelpdeskEscalationsPage />}
      renderMode="auto"
    />
  );
}
