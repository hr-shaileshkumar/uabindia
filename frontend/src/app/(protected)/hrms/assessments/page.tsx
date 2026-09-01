"use client";

import { useCallback, useEffect, useState } from "react";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import {
  ErpEmptyState,
  ErpRefreshButton,
  ErpRowActions,
  ErpSearchFilter,
} from "@/components/workspace/page-kit";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { SideDrawer } from "@/components/ui/side-drawer";
import { getApiErrorMessage } from "@/lib/api-errors";
import { hrmsApi } from "@/services/modules";

type AssessmentRow = {
  id: string;
  enrollmentId: string;
  courseTitle: string;
  courseCategory: string;
  title: string;
  assessmentType: string;
  assessmentDate: string;
  totalMarks: number;
  obtainedMarks: number;
  percentageScore: number;
  result: string;
  comments: string | null;
  reviewedBy: string | null;
  reviewDate: string | null;
};

export default function AssessmentsPage() {
  const [rows, setRows] = useState<AssessmentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [result, setResult] = useState("");
  const [assessmentType, setAssessmentType] = useState("");
  const [viewRow, setViewRow] = useState<AssessmentRow | null>(null);

  const LIMIT = 20;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrmsApi.training.getAssessments({
        search: search || undefined,
        result: result || undefined,
        assessmentType: assessmentType || undefined,
        page,
        limit: LIMIT,
      });
      setRows(res.data?.assessments ?? []);
      setTotal(res.data?.total ?? 0);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load assessments."));
    } finally {
      setLoading(false);
    }
  }, [search, result, assessmentType, page]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / LIMIT) || 1;
  const passed = rows.filter((row) => (row.result || "").toLowerCase() === "pass").length;
  const failed = rows.filter((row) => (row.result || "").toLowerCase() === "fail").length;
  const avgScore =
    rows.length > 0
      ? (rows.reduce((sum, row) => sum + (row.percentageScore || 0), 0) / rows.length).toFixed(1)
      : "0";

  return (
    <StandardPageLayout
      title="Assessments"
      subtitle="Evaluate employee performance tests, quiz results, pass criteria, and competency benchmarks."
      eyebrow="HRMS / Learning"
      icon="award"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Assessments", value: total || rows.length },
            { label: "Passed", value: passed, tone: "positive" },
            { label: "Failed", value: failed, tone: "danger" },
            { label: "Avg Score", value: `${avgScore}%`, tone: "info" },
          ]}
        />
      }
      actions={<ErpRefreshButton onClick={() => void fetchData()} loading={loading} />}
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <ErpSearchFilter
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search course or assessment title…"
          />
          <div>
            <label className="erp-label">Result</label>
            <select
              className="erp-select w-36"
              value={result}
              onChange={(e) => {
                setResult(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Results</option>
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
            </select>
          </div>
          <div>
            <label className="erp-label">Type</label>
            <input
              className="erp-input w-44"
              placeholder="Assessment type…"
              value={assessmentType}
              onChange={(e) => {
                setAssessmentType(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      }
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <CrudCard>
        <div className="erp-table-wrap">
          <table className="erp-table table-auto">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Course</th>
                <th className="erp-th">Assessment</th>
                <th className="erp-th">Type</th>
                <th className="erp-th">Date</th>
                <th className="erp-th">Marks</th>
                <th className="erp-th">Score %</th>
                <th className="erp-th">Result</th>
                <th className="erp-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="erp-td py-8 text-center text-xs text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="erp-td">
                    <ErpEmptyState message="No assessments found." />
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="erp-tr">
                    <td className="erp-td">
                      <span className="font-medium text-slate-800">{r.courseTitle}</span>
                      <p className="text-xs text-slate-400">{r.courseCategory}</p>
                    </td>
                    <td className="erp-td font-medium text-slate-700">{r.title}</td>
                    <td className="erp-td text-slate-600">{r.assessmentType}</td>
                    <td className="erp-td text-xs text-slate-500">
                      {new Date(r.assessmentDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="erp-td text-slate-600">
                      {r.obtainedMarks} / {r.totalMarks}
                    </td>
                    <td className="erp-td font-semibold text-slate-800">{r.percentageScore.toFixed(1)}%</td>
                    <td className="erp-td">
                      <span
                        className={
                          (r.result || "").toLowerCase() === "pass"
                            ? "erp-chip erp-chip-success"
                            : (r.result || "").toLowerCase() === "fail"
                              ? "erp-chip erp-chip-danger"
                              : "erp-chip"
                        }
                      >
                        {r.result}
                      </span>
                    </td>
                    <td className="erp-td text-right">
                      <ErpRowActions onView={{ label: "View", onClick: () => setViewRow(r) }} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 ? (
          <div className="mt-3 flex items-center justify-between px-1 text-sm text-slate-600">
            <span>{total} total</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="erp-action-btn erp-action-btn-secondary text-xs disabled:opacity-40"
              >
                Prev
              </button>
              <span className="px-2 py-1 text-xs">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="erp-action-btn erp-action-btn-secondary text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </CrudCard>

      <SideDrawer open={Boolean(viewRow)} onClose={() => setViewRow(null)} title="Assessment details">
        {viewRow ? (
          <div className="erp-form-grid">
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Course</label>
              <p className="text-sm text-slate-800">
                {viewRow.courseTitle}
                {viewRow.courseCategory ? ` · ${viewRow.courseCategory}` : ""}
              </p>
            </div>
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Assessment</label>
              <p className="text-sm text-slate-800">{viewRow.title}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Type</label>
              <p className="text-sm text-slate-800">{viewRow.assessmentType}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Date</label>
              <p className="text-sm text-slate-800">
                {new Date(viewRow.assessmentDate).toLocaleDateString("en-IN")}
              </p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Marks</label>
              <p className="text-sm text-slate-800">
                {viewRow.obtainedMarks} / {viewRow.totalMarks}
              </p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Score</label>
              <p className="text-sm text-slate-800">{viewRow.percentageScore.toFixed(1)}%</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Result</label>
              <p className="text-sm text-slate-800">{viewRow.result}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Reviewed by</label>
              <p className="text-sm text-slate-800">{viewRow.reviewedBy ?? "—"}</p>
            </div>
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Comments</label>
              <p className="text-sm text-slate-800">{viewRow.comments ?? "—"}</p>
            </div>
          </div>
        ) : null}
      </SideDrawer>
    </StandardPageLayout>
  );
}
