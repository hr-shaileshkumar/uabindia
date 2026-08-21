"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Pencil, Users } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ListCreateButton } from "@/components/erp/list-toolbar";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpPanelBodyClassName,
  erpPanelClassName,
  erpPanelHeaderClassName,
  erpPanelTitleClassName,
  erpStatusBadgeTone,
  erpTableRowHoverClassName,
  erpTableTdClassName,
  erpTableThClassName,
  erpTableWrapClassName,
} from "@/components/erp/erpStyles";
import { crmApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";

type Lead = {
  id: string;
  leadName: string;
  leadCode?: string;
  customerName?: string;
  status?: string;
  value?: number;
  probability?: number;
  expectedCloseDate?: string;
  stage?: string;
  owner?: string;
};

const STAGES = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

const formatCurrency = (value?: number) =>
  value != null ? `₹${value.toLocaleString("en-IN")}` : "—";

export default function CRMLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    leadName: "",
    companyName: "",
    value: 0,
    probability: 20,
    stage: "New",
    owner: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await crmApi.leads.getAll(1, 100);
      const raw = response.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      setLeads(
        list.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          leadName: String(row.leadName ?? ""),
          leadCode: row.leadCode ? String(row.leadCode) : undefined,
          customerName: String(row.customerName ?? row.companyName ?? ""),
          status: row.status ? String(row.status) : undefined,
          value: Number(row.value ?? 0),
          probability: Number(row.probability ?? 0),
          expectedCloseDate: row.expectedCloseDate ? String(row.expectedCloseDate) : undefined,
          stage: String(row.stage ?? "New"),
          owner: row.owner ? String(row.owner) : undefined,
        })),
      );
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load leads.");
      setError(message);
      notifyError(message, "CRM Leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () =>
    setForm({ leadName: "", companyName: "", value: 0, probability: 20, stage: "New", owner: "" });

  const openCreate = () => {
    setEditingId(null);
    resetForm();
    setDrawerOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditingId(lead.id);
    setForm({
      leadName: lead.leadName,
      companyName: lead.customerName ?? "",
      value: lead.value ?? 0,
      probability: lead.probability ?? 20,
      stage: lead.stage ?? "New",
      owner: lead.owner ?? "",
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!form.leadName.trim()) return;
    const payload = {
      leadName: form.leadName.trim(),
      companyName: form.companyName.trim() || undefined,
      value: form.value,
      probability: form.probability,
      stage: form.stage,
      owner: form.owner.trim() || undefined,
      status: "Open",
    };
    try {
      setSaving(true);
      if (editingId) {
        await crmApi.leads.update(editingId, payload);
        notifySuccess("Lead updated.", "CRM Leads");
      } else {
        await crmApi.leads.create(payload);
        notifySuccess("Lead created.", "CRM Leads");
      }
      setDrawerOpen(false);
      setEditingId(null);
      resetForm();
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, editingId ? "Failed to update lead." : "Failed to create lead."), "CRM Leads");
    } finally {
      setSaving(false);
    }
  };

  const stageColumns = useMemo(
    () =>
      STAGES.map((stage) => ({
        stage,
        items: leads.filter((l) => l.stage === stage || (stage === "New" && !l.stage)),
      })),
    [leads],
  );

  return (
    <StandardPageLayout
      title="Lead Pipeline"
      subtitle="Manage leads through qualification, proposal, and close stages."
      eyebrow="CRM / Leads"
      icon="pipeline"
      meta={
        !loading ? (
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            {leads.length} leads
          </span>
        ) : null
      }
      actions={<ListCreateButton label="Add lead" onClick={openCreate} />}
    >
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <section className={erpPanelClassName}>
        <div className={erpPanelHeaderClassName}>
          <h2 className={erpPanelTitleClassName}>Pipeline board</h2>
        </div>
        <div className={erpPanelBodyClassName}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Users className="h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">No leads in the pipeline</p>
              <p className="max-w-md text-sm text-slate-500">Create your first lead to start tracking the CRM pipeline.</p>
              <button type="button" onClick={openCreate} className={erpButtonClassName.secondary}>
                Add first lead
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {stageColumns.map(({ stage, items }) => (
                <div key={stage} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">{stage}</h3>
                    <span className={erpStatusBadgeTone.neutral}>{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((lead) => (
                      <button
                        type="button"
                        key={lead.id}
                        className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-slate-300"
                        onClick={() => openEdit(lead)}
                      >
                        <p className="font-medium text-slate-900">{lead.leadName}</p>
                        <p className="text-xs text-slate-500">{lead.customerName || "New lead"}</p>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">{formatCurrency(lead.value)}</span>
                          {lead.probability != null ? (
                            <span className="text-slate-500">{lead.probability}%</span>
                          ) : null}
                        </div>
                        {lead.expectedCloseDate ? (
                          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="h-3 w-3" />
                            {new Date(lead.expectedCloseDate).toLocaleDateString("en-IN")}
                          </div>
                        ) : null}
                      </button>
                    ))}
                    {items.length === 0 ? (
                      <p className="py-4 text-center text-xs text-slate-400">No leads in this stage</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className={erpPanelClassName}>
        <div className={erpPanelHeaderClassName}>
          <h2 className={erpPanelTitleClassName}>Recent leads</h2>
        </div>
        <div className={erpPanelBodyClassName}>
          <div className={erpTableWrapClassName}>
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr>
                  <th className={erpTableThClassName}>Lead</th>
                  <th className={erpTableThClassName}>Customer</th>
                  <th className={erpTableThClassName}>Value</th>
                  <th className={erpTableThClassName}>Stage</th>
                  <th className={erpTableThClassName}>Status</th>
                  <th className={erpTableThClassName}>Owner</th>
                  <th className={`${erpTableThClassName} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className={erpTableTdClassName}>
                        <div className="h-4 animate-pulse rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`${erpTableTdClassName} py-10 text-center text-slate-500`}>
                      No leads found.
                    </td>
                  </tr>
                ) : (
                  leads.slice(0, 10).map((lead) => (
                    <tr key={lead.id} className={erpTableRowHoverClassName}>
                      <td className={`${erpTableTdClassName} font-medium text-slate-900`}>{lead.leadName}</td>
                      <td className={erpTableTdClassName}>{lead.customerName || "—"}</td>
                      <td className={erpTableTdClassName}>{formatCurrency(lead.value)}</td>
                      <td className={erpTableTdClassName}>{lead.stage || "New"}</td>
                      <td className={erpTableTdClassName}>{lead.status || "—"}</td>
                      <td className={erpTableTdClassName}>{lead.owner || "Unassigned"}</td>
                      <td className={`${erpTableTdClassName} text-right`}>
                        <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2`} onClick={() => openEdit(lead)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <SideDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingId(null);
        }}
        title={editingId ? "Edit lead" : "New lead"}
        subtitle="Persists to /api/v1/crm/leads"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className={erpButtonClassName.secondary} onClick={() => setDrawerOpen(false)}>
              Cancel
            </button>
            <button type="button" className={erpButtonClassName.primary} disabled={saving} onClick={() => void handleSave()}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Create lead"}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <input
            className={erpFormInputClassName}
            placeholder="Lead name *"
            value={form.leadName}
            onChange={(e) => setForm((f) => ({ ...f, leadName: e.target.value }))}
          />
          <input
            className={erpFormInputClassName}
            placeholder="Company"
            value={form.companyName}
            onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
          />
          <input
            type="number"
            className={erpFormInputClassName}
            placeholder="Value"
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
          />
          <input
            type="number"
            className={erpFormInputClassName}
            placeholder="Probability %"
            value={form.probability}
            onChange={(e) => setForm((f) => ({ ...f, probability: Number(e.target.value) }))}
          />
          <select className={erpFormInputClassName} value={form.stage} onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}>
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
          <input
            className={erpFormInputClassName}
            placeholder="Owner"
            value={form.owner}
            onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
          />
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}
