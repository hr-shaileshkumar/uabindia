"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TrendingUp, IndianRupee, MoveRight, Plus } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpCreateButton, ErpDrawerFooter, ErpRefreshButton } from "@/components/workspace/page-kit";
import { StatusBadge } from "@/components/workspace/status-badge";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { crmApi } from "@/services/modules";

const PIPELINE_STAGES = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
] as const;

type PipelineStage = (typeof PIPELINE_STAGES)[number];

type Lead = {
  id: string;
  leadName?: string;
  leadCode?: string;
  customerName?: string;
  status?: string;
  value?: number;
  probability?: number;
  expectedCloseDate?: string;
  stage?: string;
  owner?: string;
};

const formatCurrency = (v?: number) =>
  v != null ? `₹${v.toLocaleString("en-IN")}` : "—";

const stageColour: Record<PipelineStage, string> = {
  New: "bg-slate-100 border-slate-200",
  Contacted: "bg-blue-50 border-blue-200",
  Qualified: "bg-indigo-50 border-indigo-200",
  Proposal: "bg-violet-50 border-violet-200",
  Negotiation: "bg-amber-50 border-amber-200",
  "Closed Won": "bg-emerald-50 border-emerald-200",
  "Closed Lost": "bg-rose-50 border-rose-200",
};

const stageHeaderColour: Record<PipelineStage, string> = {
  New: "bg-slate-200 text-slate-700",
  Contacted: "bg-blue-200 text-blue-800",
  Qualified: "bg-indigo-200 text-indigo-800",
  Proposal: "bg-violet-200 text-violet-800",
  Negotiation: "bg-amber-200 text-amber-800",
  "Closed Won": "bg-emerald-200 text-emerald-800",
  "Closed Lost": "bg-rose-200 text-rose-800",
};

const emptyForm = () => ({
  leadName: "",
  customerName: "",
  stage: "New" as PipelineStage,
  value: "",
  probability: "50",
  expectedCloseDate: "",
  owner: "",
});

const asList = (raw: unknown): Lead[] => {
  if (Array.isArray(raw)) return raw as Lead[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return (obj.items ?? obj.data ?? []) as Lead[];
  }
  return [];
};

export function CrmPipelineManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await crmApi.leads.getAll(1, 200);
      setLeads(asList(res.data));
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load pipeline"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const byStage = useMemo(() => {
    const map = new Map<PipelineStage, Lead[]>();
    PIPELINE_STAGES.forEach((s) => map.set(s, []));
    leads.forEach((l) => {
      const stage = (l.stage || l.status || "New") as PipelineStage;
      const key = PIPELINE_STAGES.includes(stage) ? stage : "New";
      map.get(key)!.push(l);
    });
    return map;
  }, [leads]);

  const totalValue = useMemo(
    () => leads.filter((l) => (l.stage || l.status) !== "Closed Lost").reduce((s, l) => s + (l.value || 0), 0),
    [leads],
  );
  const wonValue = useMemo(
    () => leads.filter((l) => l.stage === "Closed Won").reduce((s, l) => s + (l.value || 0), 0),
    [leads],
  );

  const handleSave = async () => {
    if (!form.leadName.trim()) { notifyError("Lead name is required."); return; }
    try {
      setSaving(true);
      await crmApi.leads.create({
        leadName: form.leadName.trim(),
        customerName: form.customerName.trim() || undefined,
        stage: form.stage,
        status: form.stage,
        value: Number(form.value) || undefined,
        probability: Number(form.probability) || undefined,
        expectedCloseDate: form.expectedCloseDate || undefined,
        owner: form.owner.trim() || undefined,
      });
      notifySuccess("Lead added to pipeline.");
      setDrawerOpen(false);
      setForm(emptyForm());
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create lead."));
    } finally {
      setSaving(false);
    }
  };

  const handleMoveStage = async (lead: Lead, direction: "forward" | "back") => {
    const currentIdx = PIPELINE_STAGES.indexOf((lead.stage || lead.status || "New") as PipelineStage);
    const nextIdx = direction === "forward" ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx < 0 || nextIdx >= PIPELINE_STAGES.length) return;
    const newStage = PIPELINE_STAGES[nextIdx];
    try {
      setMovingId(lead.id);
      await crmApi.leads.update(lead.id, { stage: newStage, status: newStage });
      notifySuccess(`Moved to ${newStage}`);
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to move stage."));
    } finally {
      setMovingId(null);
    }
  };

  return (
    <>
      <StandardPageLayout
        title="Sales Pipeline"
        subtitle="Visualise and manage your deal stages from first contact through to close."
        eyebrow="CRM / Pipeline"
        icon="trending-up"
        meta={
          <CrudHeaderStats
            items={[
              { label: "Open deals", value: leads.filter((l) => l.stage !== "Closed Lost").length, helper: "active" },
              { label: "Pipeline value", value: formatCurrency(totalValue), tone: "info" },
              { label: "Won value", value: formatCurrency(wonValue), tone: "positive" },
              { label: "Lost", value: byStage.get("Closed Lost")?.length ?? 0, tone: "danger" },
            ]}
          />
        }
        actions={
          <>
            <ErpRefreshButton onClick={() => void load()} loading={loading} />
            <ErpCreateButton label="Add deal" onClick={() => setDrawerOpen(true)} />
          </>
        }
      >
        {error && <div className="erp-alert-error text-sm mb-4">{error}</div>}

        {/* Kanban Board */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {PIPELINE_STAGES.map((stage) => {
              const stageLeads = byStage.get(stage) ?? [];
              const stageTotal = stageLeads.reduce((s, l) => s + (l.value || 0), 0);
              return (
                <div key={stage} className={`flex w-64 flex-col rounded-xl border ${stageColour[stage]} flex-shrink-0`}>
                  {/* Column header */}
                  <div className={`flex items-center justify-between rounded-t-xl px-3 py-2.5 ${stageHeaderColour[stage]}`}>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide">{stage}</p>
                      <p className="text-xs opacity-75">{stageLeads.length} deals · {formatCurrency(stageTotal)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setForm({ ...emptyForm(), stage }); setDrawerOpen(true); }}
                      className="rounded-lg p-1 hover:bg-black/10 transition-colors"
                      title={`Add to ${stage}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-2 p-2 min-h-[200px]">
                    {stageLeads.length === 0 && (
                      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-current/20 py-8 text-center opacity-40">
                        <TrendingUp className="h-5 w-5 mb-1" />
                        <p className="text-xs">No deals</p>
                      </div>
                    )}
                    {stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="cursor-pointer rounded-lg border border-white/80 bg-white p-3 shadow-xs hover:shadow-sm transition-shadow"
                        onClick={() => { setSelectedLead(lead); setDetailOpen(true); }}
                      >
                        <p className="text-sm font-semibold text-slate-900 truncate">{lead.leadName || lead.leadCode || "—"}</p>
                        {lead.customerName && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">{lead.customerName}</p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          {lead.value != null && (
                            <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-700">
                              <IndianRupee className="h-3 w-3" />
                              {lead.value.toLocaleString("en-IN")}
                            </span>
                          )}
                          {lead.probability != null && (
                            <span className="text-xs text-slate-500">{lead.probability}%</span>
                          )}
                        </div>
                        {/* Move buttons */}
                        <div className="mt-2 flex gap-1" onClick={(e) => e.stopPropagation()}>
                          {stage !== "New" && stage !== "Closed Lost" && (
                            <button
                              type="button"
                              disabled={movingId === lead.id}
                              onClick={() => void handleMoveStage(lead, "back")}
                              className="flex-1 rounded bg-slate-100 py-0.5 text-xs text-slate-600 hover:bg-slate-200 disabled:opacity-50 transition-colors"
                            >
                              ← Back
                            </button>
                          )}
                          {stage !== "Closed Won" && stage !== "Closed Lost" && (
                            <button
                              type="button"
                              disabled={movingId === lead.id}
                              onClick={() => void handleMoveStage(lead, "forward")}
                              className="flex-1 flex items-center justify-center gap-0.5 rounded bg-indigo-600 py-0.5 text-xs text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                            >
                              Next <MoveRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </StandardPageLayout>

      {/* Add Deal Drawer */}
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add deal to pipeline"
        footer={
          <ErpDrawerFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={() => void handleSave()}
            saving={saving}
            saveLabel="Add deal"
          />
        }
      >
        <div className="space-y-4">
          <div>
            <label className="erp-label">Deal / lead name *</label>
            <input className="erp-input mt-1" value={form.leadName} onChange={(e) => setForm({ ...form, leadName: e.target.value })} placeholder="Enterprise ERP Deal - Acme Corp" />
          </div>
          <div>
            <label className="erp-label">Customer / company</label>
            <input className="erp-input mt-1" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="Acme Corp" />
          </div>
          <div>
            <label className="erp-label">Pipeline stage</label>
            <select className="erp-input mt-1" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as PipelineStage })}>
              {PIPELINE_STAGES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="erp-label">Deal value (₹)</label>
              <input type="number" min={0} className="erp-input mt-1" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="500000" />
            </div>
            <div>
              <label className="erp-label">Probability (%)</label>
              <input type="number" min={0} max={100} className="erp-input mt-1" value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="erp-label">Expected close date</label>
            <input type="date" className="erp-input mt-1" value={form.expectedCloseDate} onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })} />
          </div>
          <div>
            <label className="erp-label">Owner / rep</label>
            <input className="erp-input mt-1" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="Sales rep name" />
          </div>
        </div>
      </SideDrawer>

      {/* Deal Detail Drawer */}
      <SideDrawer
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedLead(null); }}
        title={selectedLead?.leadName || "Deal detail"}
        subtitle={selectedLead?.customerName}
        footer={
          <button type="button" className="erp-action-btn erp-action-btn-secondary w-full" onClick={() => setDetailOpen(false)}>
            Close
          </button>
        }
      >
        {selectedLead && (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Stage</span>
                <StatusBadge tone="info">{selectedLead.stage || selectedLead.status || "New"}</StatusBadge>
              </div>
              {selectedLead.value != null && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Deal value</span>
                  <span className="font-semibold text-emerald-700">{formatCurrency(selectedLead.value)}</span>
                </div>
              )}
              {selectedLead.probability != null && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Win probability</span>
                  <span className="font-semibold">{selectedLead.probability}%</span>
                </div>
              )}
              {selectedLead.expectedCloseDate && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Expected close</span>
                  <span>{new Date(selectedLead.expectedCloseDate).toLocaleDateString("en-IN")}</span>
                </div>
              )}
              {selectedLead.owner && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Owner</span>
                  <span>{selectedLead.owner}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {PIPELINE_STAGES.indexOf((selectedLead.stage || "New") as PipelineStage) > 0 && (
                <button
                  type="button"
                  onClick={() => { void handleMoveStage(selectedLead, "back"); setDetailOpen(false); }}
                  className="flex-1 erp-action-btn erp-action-btn-secondary"
                >
                  ← Move back
                </button>
              )}
              {(selectedLead.stage || "New") !== "Closed Won" && (selectedLead.stage || "New") !== "Closed Lost" && (
                <button
                  type="button"
                  onClick={() => { void handleMoveStage(selectedLead, "forward"); setDetailOpen(false); }}
                  className="flex-1 erp-action-btn erp-action-btn-primary"
                >
                  Advance stage →
                </button>
              )}
            </div>
          </div>
        )}
      </SideDrawer>
    </>
  );
}
