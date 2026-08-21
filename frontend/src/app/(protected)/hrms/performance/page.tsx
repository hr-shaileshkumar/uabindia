"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import {
  ErpApproveRejectButtons,
  ErpCreateButton,
  ErpDrawerFooter,
  ErpRefreshButton,
  ErpRowActions,
  ErpSearchFilter,
} from "@/components/erp/erp-page-kit";
import { SideDrawer } from "@/components/ui/side-drawer";
import { UniversalDeleteDialog } from "@/components/erp/templates/UniversalDeleteDialog";
import { erpButtonClassName } from "@/components/erp/erpStyles";
import { hrmsApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";

type CycleRow = {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  selfAssessmentDeadline?: string;
  managerAssessmentDeadline?: string;
  status: string;
  isActive: boolean;
};

type AppraisalRow = {
  id: string;
  employeeId?: string;
  employeeName?: string;
  status?: string;
  overallRating?: number;
};

const emptyCycle = () => {
  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 3);
  const selfDue = new Date(end);
  selfDue.setDate(selfDue.getDate() - 21);
  const mgrDue = new Date(end);
  mgrDue.setDate(mgrDue.getDate() - 7);
  return {
    name: "",
    description: "",
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    selfAssessmentDeadline: selfDue.toISOString().slice(0, 10),
    managerAssessmentDeadline: mgrDue.toISOString().slice(0, 10),
  };
};

export default function PerformancePage() {
  const [cycles, setCycles] = useState<CycleRow[]>([]);
  const [appraisals, setAppraisals] = useState<AppraisalRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [selectedAppraisal, setSelectedAppraisal] = useState<AppraisalRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyCycle());
  const [reviewForm, setReviewForm] = useState({ rating: "3", comments: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await hrmsApi.appraisals.cycles.list(1, 100);
      const payload = data as { cycles?: CycleRow[]; data?: CycleRow[] } | CycleRow[];
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.cycles)
          ? payload.cycles
          : Array.isArray(payload.data)
            ? payload.data
            : [];
      setCycles(list);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load appraisal cycles."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadAppraisals = useCallback(async (cycleId: string) => {
    try {
      const { data } = await hrmsApi.appraisals.cycles.appraisals(cycleId);
      const list = Array.isArray(data)
        ? data
        : Array.isArray((data as { appraisals?: unknown })?.appraisals)
          ? ((data as { appraisals: AppraisalRow[] }).appraisals)
          : [];
      setAppraisals(list as AppraisalRow[]);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to load appraisals for cycle."));
      setAppraisals([]);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return cycles.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || (c.status || "").toLowerCase().includes(q)
    );
  }, [cycles, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyCycle());
    setDrawerOpen(true);
  };

  const openEdit = (cycle: CycleRow) => {
    setEditingId(cycle.id);
    setForm({
      name: cycle.name,
      description: cycle.description || "",
      startDate: cycle.startDate?.slice(0, 10) || "",
      endDate: cycle.endDate?.slice(0, 10) || "",
      selfAssessmentDeadline: (cycle.selfAssessmentDeadline || cycle.endDate)?.slice(0, 10) || "",
      managerAssessmentDeadline: (cycle.managerAssessmentDeadline || cycle.endDate)?.slice(0, 10) || "",
    });
    setDrawerOpen(true);
  };

  const saveCycle = async () => {
    if (!form.name.trim()) {
      notifyError("Cycle name is required.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: form.name,
        description: form.description || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        selfAssessmentDeadline: form.selfAssessmentDeadline,
        managerAssessmentDeadline: form.managerAssessmentDeadline,
      };
      if (editingId) {
        await hrmsApi.appraisals.cycles.update(editingId, payload);
        notifySuccess("Appraisal cycle updated.");
      } else {
        await hrmsApi.appraisals.cycles.create(payload);
        notifySuccess("Appraisal cycle created.");
      }
      setDrawerOpen(false);
      await load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Could not save cycle."));
    } finally {
      setSaving(false);
    }
  };

  const activate = async (id: string) => {
    try {
      await hrmsApi.appraisals.cycles.activate(id);
      notifySuccess("Cycle activated.");
      await load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Could not activate cycle."));
    }
  };

  const submitReview = async (approve: boolean) => {
    if (!selectedAppraisal) return;
    try {
      setSaving(true);
      if (approve) {
        await hrmsApi.appraisals.assess(selectedAppraisal.id, {
          overallRating: Number(reviewForm.rating),
          managerComments: reviewForm.comments || undefined,
        });
        await hrmsApi.appraisals.approve(selectedAppraisal.id, { comments: reviewForm.comments || undefined });
        notifySuccess("Appraisal assessed and approved.");
      } else {
        await hrmsApi.appraisals.reject(selectedAppraisal.id, { comments: reviewForm.comments || undefined });
        notifySuccess("Appraisal rejected.");
      }
      setReviewOpen(false);
      if (selectedCycleId) await loadAppraisals(selectedCycleId);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Could not update appraisal."));
    } finally {
      setSaving(false);
    }
  };

  const stats = [
    { label: "Cycles", value: cycles.length, tone: "info" as const },
    { label: "Active", value: cycles.filter((c) => c.isActive).length, tone: "positive" as const },
    { label: "Appraisals", value: appraisals.length, tone: "neutral" as const },
  ];

  return (
    <StandardPageLayout
      title="Performance & Appraisals"
      icon="award"
      meta={<CrudHeaderStats items={stats} />}
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          <ErpCreateButton label="New cycle" onClick={openCreate} />
        </>
      }
      filters={<ErpSearchFilter value={search} onChange={setSearch} placeholder="Filter cycle name or status…" />}
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <CrudCard>
        <div className="erp-table-wrap">
          <table className="erp-table table-auto">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Cycle</th>
                <th className="erp-th">Period</th>
                <th className="erp-th">Status</th>
                <th className="erp-th">Active</th>
                <th className="erp-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="erp-td py-8 text-center text-xs text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="erp-td py-8 text-center text-xs text-slate-500">
                    No appraisal cycles. Create one to start reviews.
                  </td>
                </tr>
              ) : (
                filtered.map((cycle) => (
                  <tr key={cycle.id} className="erp-tr">
                    <td className="erp-td">
                      <button
                        type="button"
                        className="text-left"
                        onClick={() => {
                          setSelectedCycleId(cycle.id);
                          void loadAppraisals(cycle.id);
                        }}
                      >
                        <div className="erp-row-title">{cycle.name}</div>
                        {cycle.description ? <div className="text-xs text-slate-500">{cycle.description}</div> : null}
                      </button>
                    </td>
                    <td className="erp-td text-xs text-slate-500">
                      {new Date(cycle.startDate).toLocaleDateString("en-IN")} –{" "}
                      {new Date(cycle.endDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="erp-td">
                      <span className="erp-chip">{cycle.status}</span>
                    </td>
                    <td className="erp-td">
                      <span className={cycle.isActive ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
                        {cycle.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="erp-td">
                      <div className="flex items-center justify-end gap-1">
                        {!cycle.isActive ? (
                          <button
                            type="button"
                            className={`${erpButtonClassName.secondary} text-xs`}
                            onClick={() => void activate(cycle.id)}
                          >
                            Activate
                          </button>
                        ) : null}
                        <ErpRowActions
                          onView={{
                            label: "Open appraisals",
                            onClick: () => {
                              setSelectedCycleId(cycle.id);
                              void loadAppraisals(cycle.id);
                            },
                          }}
                          onEdit={{ label: "Edit", onClick: () => openEdit(cycle) }}
                          onDelete={{ label: "Delete", onClick: () => setDeleteId(cycle.id) }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CrudCard>

      {selectedCycleId ? (
        <CrudCard>
          <div className="mb-3 flex items-center justify-between gap-2 px-1">
            <h2 className="text-sm font-semibold text-slate-900">Cycle appraisals</h2>
            <button type="button" className={erpButtonClassName.secondary} onClick={() => setSelectedCycleId(null)}>
              Close
            </button>
          </div>
          <div className="erp-table-wrap">
            <table className="erp-table table-auto">
              <thead className="erp-thead">
                <tr>
                  <th className="erp-th">Employee</th>
                  <th className="erp-th">Status</th>
                  <th className="erp-th">Rating</th>
                  <th className="erp-th text-right">Review</th>
                </tr>
              </thead>
              <tbody>
                {appraisals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="erp-td py-6 text-center text-xs text-slate-500">
                      No appraisals in this cycle yet.
                    </td>
                  </tr>
                ) : (
                  appraisals.map((row) => (
                    <tr key={row.id} className="erp-tr">
                      <td className="erp-td text-xs font-medium">{row.employeeName || row.employeeId || "—"}</td>
                      <td className="erp-td">
                        <span className="erp-chip">{row.status || "Pending"}</span>
                      </td>
                      <td className="erp-td text-xs">{row.overallRating ?? "—"}</td>
                      <td className="erp-td">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className={`${erpButtonClassName.secondary} text-xs`}
                            onClick={() => {
                              setSelectedAppraisal(row);
                              setReviewForm({
                                rating: String(row.overallRating ?? 3),
                                comments: "",
                              });
                              setReviewOpen(true);
                            }}
                          >
                            Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CrudCard>
      ) : null}

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? "Edit appraisal cycle" : "New appraisal cycle"}
        footer={
          <ErpDrawerFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={() => void saveCycle()}
            saving={saving}
            isEdit={Boolean(editingId)}
          />
        }
      >
        <div className="erp-form-grid">
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Name</label>
            <input className="erp-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Description</label>
            <textarea
              className="erp-input min-h-20"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Start date</label>
            <input
              type="date"
              className="erp-input"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">End date</label>
            <input
              type="date"
              className="erp-input"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Self-assessment deadline</label>
            <input
              type="date"
              className="erp-input"
              value={form.selfAssessmentDeadline}
              onChange={(e) => setForm((f) => ({ ...f, selfAssessmentDeadline: e.target.value }))}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Manager deadline</label>
            <input
              type="date"
              className="erp-input"
              value={form.managerAssessmentDeadline}
              onChange={(e) => setForm((f) => ({ ...f, managerAssessmentDeadline: e.target.value }))}
            />
          </div>
        </div>
      </SideDrawer>

      <SideDrawer
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title="Manager review"
        footer={
          <ErpApproveRejectButtons
            disabled={saving}
            onApprove={() => void submitReview(true)}
            onReject={() => void submitReview(false)}
            approveLabel="Assess & approve"
            rejectLabel="Reject"
          />
        }
      >
        <div className="erp-form-grid">
          <div className="erp-field">
            <label className="erp-label">Overall rating (1–5)</label>
            <input
              type="number"
              min={1}
              max={5}
              className="erp-input"
              value={reviewForm.rating}
              onChange={(e) => setReviewForm((f) => ({ ...f, rating: e.target.value }))}
            />
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Comments</label>
            <textarea
              className="erp-input min-h-24"
              value={reviewForm.comments}
              onChange={(e) => setReviewForm((f) => ({ ...f, comments: e.target.value }))}
            />
          </div>
        </div>
      </SideDrawer>

      <UniversalDeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete appraisal cycle"
        onConfirm={async () => {
          if (!deleteId) return;
          await hrmsApi.appraisals.cycles.delete(deleteId);
          notifySuccess("Cycle deleted.");
          setDeleteId(null);
          await load();
        }}
      />
    </StandardPageLayout>
  );
}
