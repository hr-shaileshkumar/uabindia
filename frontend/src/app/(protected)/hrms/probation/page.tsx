"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, CheckCircle, AlertCircle, XCircle, Star } from "lucide-react";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type ProbationRecord = {
  id: string;
  fullName?: string;
  employeeName?: string;
  employeeCode?: string;
  department?: string;
  joinDate?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  probationScore?: number;
  reviewScore?: number;
  managerName?: string;
  comments?: string;
};

const STATUS_CONFIG: Record<string, { label: string; chip: string; icon: React.ReactNode }> = {
  Active:    { label: "Active",    chip: "erp-chip erp-chip-info",    icon: <Clock className="h-3.5 w-3.5" /> },
  Confirmed: { label: "Confirmed", chip: "erp-chip erp-chip-success", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  Extended:  { label: "Extended",  chip: "erp-chip erp-chip-warning", icon: <AlertCircle className="h-3.5 w-3.5" /> },
  Terminated:{ label: "Terminated",chip: "erp-chip erp-chip-danger",  icon: <XCircle className="h-3.5 w-3.5" /> },
};

export default function ProbationPage() {
  const [records, setRecords] = useState<ProbationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReview, setShowReview] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ score: 80, action: "Confirmed", comments: "" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch recently hired employees as probation proxy
      const res = await hrApi.hrms.employees.list(1, 50, { status: "Active" });
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.employees) ? raw.employees : [];
      // Filter employees on probation (within 6 months of joining)
      const now = new Date();
      const probation: ProbationRecord[] = list
        .filter((e: ProbationRecord) => {
          const join = e.joinDate ? new Date(e.joinDate) : null;
          if (!join) return false;
          const monthsDiff = (now.getTime() - join.getTime()) / (1000 * 60 * 60 * 24 * 30);
          return monthsDiff <= 6;
        })
        .map((e: ProbationRecord) => {
          const join = e.joinDate ? new Date(e.joinDate) : new Date();
          const end = new Date(join);
          end.setMonth(end.getMonth() + 3);
          return {
            id: e.id,
            employeeName: e.fullName || e.employeeName,
            employeeCode: e.employeeCode,
            department: e.department,
            startDate: join.toISOString(),
            endDate: end.toISOString(),
            status: end < now ? "Confirmed" : "Active",
            reviewScore: e.probationScore,
            managerName: e.managerName,
          };
        });
      setRecords(probation);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load probation records.");
      setError(msg);
      notifyError(msg, "Probation");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReview) return;
    try {
      setSaving(true);
      await hrApi.hrms.employees.update(showReview, {
        probationScore: reviewForm.score,
        probationStatus: reviewForm.action,
        probationComments: reviewForm.comments,
      });
      setShowReview(null);
      setReviewForm({ score: 80, action: "Confirmed", comments: "" });
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to submit probation review."), "Probation Review");
    } finally {
      setSaving(false);
    }
  };

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (r.employeeName || "").toLowerCase().includes(q) || (r.employeeCode || "").toLowerCase().includes(q);
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const confirmed  = records.filter((r) => r.status === "Confirmed").length;
  const active     = records.filter((r) => r.status === "Active").length;
  const extended   = records.filter((r) => r.status === "Extended").length;
  const avgScore   = records.filter((r) => r.reviewScore).length
    ? Math.round(records.reduce((s, r) => s + (r.reviewScore || 0), 0) / records.filter((r) => r.reviewScore).length)
    : null;
  const [currentTime] = useState(() => Date.now());

  return (
    <StandardPageLayout
      title="Probation Tracker"
      subtitle="Monitor employee probation timelines, review milestones, confirmation decisions, and extension workflows."
      eyebrow="HRMS / Employee Lifecycle"
      icon="employees"
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label className="erp-label">Search</label>
            <input className="erp-input" placeholder="Employee name or code…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="erp-label">Status</label>
            <select className="erp-select w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Extended">Extended</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>
          {(search || statusFilter) && (
            <button type="button" onClick={() => { setSearch(""); setStatusFilter(""); }} className="erp-action-btn erp-action-btn-secondary">Clear</button>
          )}
        </div>
      }
      meta={
        <ErpHeaderSummary
          items={[
            { label: "Probation", value: records.length },
            { label: "Active", value: active, tone: "info" },
            { label: "Confirmed", value: confirmed, tone: "success" },
            { label: "Extended", value: `${extended}${avgScore ? ` / ${avgScore}%` : ""}`, tone: "warning" },
          ]}
        />
      }
    >
      {error && <div className="erp-alert-error">{error}</div>}

      {/* Review Modal */}
      {showReview && (
        <div className="erp-modal-backdrop" onClick={() => setShowReview(null)}>
          <div className="erp-modal-card erp-modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-accent" />
            <div className="erp-modal-header">
              <span className="erp-modal-title">Probation Review</span>
              <button type="button" onClick={() => setShowReview(null)} className="erp-modal-close" aria-label="Close">✕</button>
            </div>
            <form onSubmit={handleReview}>
              <div className="erp-modal-body space-y-4">
                <div>
                  <label className="erp-label">Review Score (%)</label>
                  <input className="erp-input" type="number" min={0} max={100} value={reviewForm.score} onChange={(e) => setReviewForm({ ...reviewForm, score: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="erp-label">Decision</label>
                  <select className="erp-select" value={reviewForm.action} onChange={(e) => setReviewForm({ ...reviewForm, action: e.target.value })}>
                    <option value="Confirmed">Confirm Employee</option>
                    <option value="Extended">Extend Probation</option>
                    <option value="Terminated">Terminate</option>
                  </select>
                </div>
                <div>
                  <label className="erp-label">Manager Comments</label>
                  <textarea className="erp-input" rows={3} value={reviewForm.comments} onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })} placeholder="Performance notes and justification…" />
                </div>
              </div>
              <div className="erp-modal-footer">
                <button type="button" onClick={() => setShowReview(null)} className="erp-action-btn erp-action-btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="erp-action-btn erp-action-btn-primary">{saving ? "Saving…" : "Submit Review"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Probation Records</h2>
            <p className="mt-1 text-sm text-slate-500">{filtered.length} employees in probation window</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Employee</th>
                <th className="erp-th">Department</th>
                <th className="erp-th">Start</th>
                <th className="erp-th">End / Review</th>
                <th className="erp-th">Score</th>
                <th className="erp-th">Status</th>
                <th className="erp-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="erp-td"><div className="h-4 animate-pulse rounded bg-slate-100" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="erp-td py-16 text-center">
                  <p className="text-sm text-slate-400">No probation records found for the selected filters.</p>
                </td></tr>
              ) : (
                filtered.map((r) => {
                  const cfg = STATUS_CONFIG[r.status || "Active"] || STATUS_CONFIG.Active;
                  const daysLeft = r.endDate ? Math.ceil((new Date(r.endDate).getTime() - currentTime) / 86400000) : null;
                  return (
                    <tr key={r.id} className="erp-tr">
                      <td className="erp-td">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                            {(r.employeeName || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{r.employeeName || "—"}</p>
                            {r.employeeCode && <p className="text-xs text-slate-500">{r.employeeCode}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="erp-td text-slate-600">{r.department || "—"}</td>
                      <td className="erp-td text-slate-600">{r.startDate ? new Date(r.startDate).toLocaleDateString("en-IN") : "—"}</td>
                      <td className="erp-td">
                        <div>
                          <p className="text-slate-700">{r.endDate ? new Date(r.endDate).toLocaleDateString("en-IN") : "—"}</p>
                          {daysLeft !== null && daysLeft > 0 && (
                            <p className={`text-xs font-medium ${daysLeft <= 7 ? "text-red-600" : "text-slate-500"}`}>
                              {daysLeft}d remaining
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="erp-td">
                        {r.reviewScore != null ? (
                          <div className="flex items-center gap-1.5">
                            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                            <span className="font-semibold text-slate-900">{r.reviewScore}%</span>
                          </div>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="erp-td">
                        <span className={`${cfg.chip} flex w-fit items-center gap-1`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </td>
                      <td className="erp-td text-right">
                        {r.status === "Active" && (
                          <button type="button" onClick={() => setShowReview(r.id)} className="erp-action-btn erp-action-btn-secondary text-xs px-3">
                            Review
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </StandardPageLayout>
  );
}
