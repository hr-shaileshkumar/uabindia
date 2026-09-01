"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Clock, CheckCircle, AlertCircle, XCircle, Star } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import {
  ErpDrawerFooter,
  ErpRefreshButton,
  ErpRowActions,
} from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { SideDrawer } from "@/components/ui/side-drawer";
import { hrmsApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type ProbationRecord = {
  id: string;
  employeeName?: string;
  employeeCode?: string;
  department?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  reviewScore?: number;
  managerName?: string;
  comments?: string;
};

const STATUS_CONFIG: Record<string, { label: string; chip: string; icon: ReactNode }> = {
  Active: { label: "Active", chip: "erp-chip erp-chip-info", icon: <Clock className="h-3.5 w-3.5" /> },
  Confirmed: { label: "Confirmed", chip: "erp-chip erp-chip-success", icon: <CheckCircle className="h-3.5 w-3.5" /> },
  Extended: { label: "Extended", chip: "erp-chip erp-chip-warning", icon: <AlertCircle className="h-3.5 w-3.5" /> },
  Terminated: { label: "Terminated", chip: "erp-chip erp-chip-danger", icon: <XCircle className="h-3.5 w-3.5" /> },
};

export default function ProbationPage() {
  const [records, setRecords] = useState<ProbationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewRow, setViewRow] = useState<ProbationRecord | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ score: "80", action: "Confirmed", comments: "" });
  const [saving, setSaving] = useState(false);
  const [currentTime] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrmsApi.hrms.employees.list(1, 100, { probation: true });
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.employees) ? raw.employees : [];
      const now = new Date();
      setRecords(
        list.map((e: Record<string, unknown>) => {
          const joinRaw = (e.dateOfJoining || e.joinDate) as string | undefined;
          const join = joinRaw ? new Date(joinRaw) : new Date();
          const end = e.probationEndDate
            ? new Date(String(e.probationEndDate))
            : (() => {
                const d = new Date(join);
                d.setMonth(d.getMonth() + 3);
                return d;
              })();
          return {
            id: String(e.id),
            employeeName: String(e.fullName || e.employeeName || ""),
            employeeCode: e.employeeCode ? String(e.employeeCode) : undefined,
            department: String(e.departmentName || e.department || ""),
            startDate: join.toISOString(),
            endDate: end.toISOString(),
            status: String(e.probationStatus || e.status || (end < now ? "Confirmed" : "Active")),
            reviewScore: typeof e.probationScore === "number" ? e.probationScore : undefined,
            managerName: e.managerName ? String(e.managerName) : undefined,
            comments: e.probationComments ? String(e.probationComments) : undefined,
          } satisfies ProbationRecord;
        }),
      );
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load probation records.");
      setError(msg);
      notifyError(msg, "Probation");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter((r) => {
      const matchSearch =
        !q ||
        (r.employeeName || "").toLowerCase().includes(q) ||
        (r.employeeCode || "").toLowerCase().includes(q);
      const matchStatus = !statusFilter || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [records, search, statusFilter]);

  const openReview = (row: ProbationRecord) => {
    setReviewId(row.id);
    setReviewForm({
      score: String(row.reviewScore ?? 80),
      action: "Confirmed",
      comments: row.comments || "",
    });
  };

  const handleReview = async () => {
    if (!reviewId) return;
    const score = Number(reviewForm.score);
    if (!reviewForm.action || Number.isNaN(score) || score < 0 || score > 100) {
      notifyError("Score (0–100) and decision are required.");
      return;
    }
    try {
      setSaving(true);
      await hrmsApi.hrms.employees.update(reviewId, {
        probationScore: score,
        probationStatus: reviewForm.action,
        probationComments: reviewForm.comments || undefined,
      });
      notifySuccess("Probation review saved.");
      setReviewId(null);
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to submit probation review."), "Probation Review");
    } finally {
      setSaving(false);
    }
  };

  const confirmed = records.filter((r) => r.status === "Confirmed").length;
  const active = records.filter((r) => r.status === "Active").length;
  const extended = records.filter((r) => r.status === "Extended").length;

  const list = useErpListView({
    listKey: "hrms-probation",
    rows: filtered,
    loading,
    emptyMessage: "No probation records found for the selected filters.",
    getRowId: (row) => row.id,
    columns: [
      { key: "employee", label: "Employee" },
      { key: "department", label: "Department" },
      { key: "startDate", label: "Start", dataType: "date" },
      { key: "endDate", label: "End / Review", dataType: "date" },
      { key: "reviewScore", label: "Score", dataType: "number" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Actions", locked: true },
    ],
    onRefresh: () => void load(),
    extraFilters: (
      <>
        <input
          type="search"
          className="erp-input max-w-xs"
          placeholder="Employee name or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="erp-select w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Extended">Extended</option>
          <option value="Terminated">Terminated</option>
        </select>
      </>
    ),
    renderRow: (r) => {
      const cfg = STATUS_CONFIG[r.status || "Active"] || STATUS_CONFIG.Active;
      const daysLeft = r.endDate ? Math.ceil((new Date(r.endDate).getTime() - currentTime) / 86400000) : null;
      return (
        <>
          <td className="erp-td">
            <p className="font-semibold text-slate-900">{r.employeeName || "—"}</p>
            {r.employeeCode ? <p className="text-xs text-slate-500">{r.employeeCode}</p> : null}
          </td>
          <td className="erp-td text-slate-600">{r.department || "—"}</td>
          <td className="erp-td text-slate-600">
            {r.startDate ? new Date(r.startDate).toLocaleDateString("en-IN") : "—"}
          </td>
          <td className="erp-td">
            <p className="text-slate-700">{r.endDate ? new Date(r.endDate).toLocaleDateString("en-IN") : "—"}</p>
            {daysLeft !== null && daysLeft > 0 ? (
              <p className={`text-xs font-medium ${daysLeft <= 7 ? "text-red-600" : "text-slate-500"}`}>{daysLeft}d remaining</p>
            ) : null}
          </td>
          <td className="erp-td">
            {r.reviewScore != null ? (
              <div className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-slate-900">{r.reviewScore}%</span>
              </div>
            ) : (
              <span className="text-slate-400">—</span>
            )}
          </td>
          <td className="erp-td">
            <span className={`${cfg.chip} flex w-fit items-center gap-1`}>
              {cfg.icon}
              {cfg.label}
            </span>
          </td>
          <td className="erp-td">
            <ErpRowActions
              onView={{ label: "View", onClick: () => setViewRow(r) }}
              onEdit={r.status === "Active" ? { label: "Review", onClick: () => openReview(r) } : undefined}
            />
          </td>
        </>
      );
    },
  });

  return (
    <StandardPageLayout
      title="Probation Tracker"
      subtitle="Monitor new hire evaluation periods, milestone check-ins, extensions, and confirmation decisions."
      eyebrow="HRMS / Lifecycle"
      icon="employees"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Probation", value: records.length },
            { label: "Active", value: active, tone: "info" },
            { label: "Confirmed", value: confirmed, tone: "positive" },
            { label: "Extended", value: extended, tone: "warning" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          {list.headerTools}
        </>
      }
      filters={list.filterBar}
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <CrudCard>{list.table}</CrudCard>

      <SideDrawer open={Boolean(viewRow)} onClose={() => setViewRow(null)} title="Probation details">
        {viewRow ? (
          <div className="erp-form-grid">
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Employee</label>
              <p className="text-sm text-slate-800">
                {viewRow.employeeName}
                {viewRow.employeeCode ? ` (${viewRow.employeeCode})` : ""}
              </p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Department</label>
              <p className="text-sm text-slate-800">{viewRow.department || "—"}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Status</label>
              <p className="text-sm text-slate-800">{viewRow.status || "—"}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Start</label>
              <p className="text-sm text-slate-800">
                {viewRow.startDate ? new Date(viewRow.startDate).toLocaleDateString("en-IN") : "—"}
              </p>
            </div>
            <div className="erp-field">
              <label className="erp-label">End</label>
              <p className="text-sm text-slate-800">
                {viewRow.endDate ? new Date(viewRow.endDate).toLocaleDateString("en-IN") : "—"}
              </p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Score</label>
              <p className="text-sm text-slate-800">{viewRow.reviewScore != null ? `${viewRow.reviewScore}%` : "—"}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Manager</label>
              <p className="text-sm text-slate-800">{viewRow.managerName || "—"}</p>
            </div>
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Comments</label>
              <p className="text-sm text-slate-800">{viewRow.comments || "—"}</p>
            </div>
          </div>
        ) : null}
      </SideDrawer>

      <SideDrawer
        open={Boolean(reviewId)}
        onClose={() => setReviewId(null)}
        title="Probation review"
        footer={
          <ErpDrawerFooter
            onCancel={() => setReviewId(null)}
            onSave={() => void handleReview()}
            saving={saving}
            saveLabel="Submit review"
            isEdit
          />
        }
      >
        <div className="erp-form-grid">
          <div className="erp-field">
            <label className="erp-label">Review score (%) *</label>
            <input
              className="erp-input"
              type="number"
              min={0}
              max={100}
              value={reviewForm.score}
              onChange={(e) => setReviewForm({ ...reviewForm, score: e.target.value })}
            />
          </div>
          <div className="erp-field">
            <label className="erp-label">Decision *</label>
            <select
              className="erp-select"
              value={reviewForm.action}
              onChange={(e) => setReviewForm({ ...reviewForm, action: e.target.value })}
            >
              <option value="Confirmed">Confirm Employee</option>
              <option value="Extended">Extend Probation</option>
              <option value="Terminated">Terminate</option>
            </select>
          </div>
          <div className="erp-field md:col-span-2">
            <label className="erp-label">Manager comments</label>
            <textarea
              className="erp-input min-h-24"
              value={reviewForm.comments}
              onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
              placeholder="Performance notes and justification…"
            />
          </div>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}
