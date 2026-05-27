"use client";

import { useCallback, useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";

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

const RESULT_STYLE: Record<string, string> = {
  Pass: "bg-green-100 text-green-700",
  Fail: "bg-red-100 text-red-700",
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

  const LIMIT = 20;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrApi.training.getAssessments({
        search: search || undefined,
        result: result || undefined,
        assessmentType: assessmentType || undefined,
        page,
        limit: LIMIT,
      });
      setRows(res.data?.assessments ?? []);
      setTotal(res.data?.total ?? 0);
    } catch {
      setError("Failed to load assessments.");
    } finally {
      setLoading(false);
    }
  }, [search, result, assessmentType, page]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <StandardPageLayout
      title="Assessments"
      subtitle="All training assessments across all enrolled employees."
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <input
            type="text"
            placeholder="Search course or assessment title…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 w-64"
          />
          <select
            value={result}
            onChange={(e) => { setResult(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
          >
            <option value="">All Results</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>
          <input
            type="text"
            placeholder="Assessment type…"
            value={assessmentType}
            onChange={(e) => { setAssessmentType(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 w-44"
          />
          {(search || result || assessmentType) && (
            <button type="button" onClick={() => { setSearch(""); setResult(""); setAssessmentType(""); setPage(1); }}
              className="text-xs text-slate-500 hover:text-slate-800 underline">Clear filters</button>
          )}
        </div>
      }
    >
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>}

      {/* KPI summary cards */}
      <div className="erp-kpi-grid mb-4">
        <div className="erp-kpi-card"><p className="erp-kpi-label">Total Assessments</p><p className="erp-kpi-value">{rows.length}</p><p className="erp-kpi-meta">Assessment records</p></div>
        <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Passed</p><p className="erp-kpi-value erp-kpi-value-success">{rows.filter(r => (r.result || '').toLowerCase() === 'pass').length}</p><p className="erp-kpi-meta">Passed assessments</p></div>
        <div className="erp-kpi-card erp-kpi-card-danger"><p className="erp-kpi-label">Failed</p><p className="erp-kpi-value erp-kpi-value-danger">{rows.filter(r => (r.result || '').toLowerCase() === 'fail').length}</p><p className="erp-kpi-meta">Failed assessments</p></div>
        <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Avg Score</p><p className="erp-kpi-value">{rows.length > 0 ? (rows.reduce((s, r) => s + (r.percentageScore || 0), 0) / rows.length).toFixed(1) : 0}%</p><p className="erp-kpi-meta">Average percentage score</p></div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {["Course", "Assessment", "Type", "Date", "Marks", "Score %", "Result", "Reviewed By"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-5 py-3">
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                </td></tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400">No assessments found.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <span className="font-medium text-slate-800">{r.courseTitle}</span>
                  <p className="text-xs text-slate-400">{r.courseCategory}</p>
                </td>
                <td className="px-5 py-3 font-medium text-slate-700">{r.title}</td>
                <td className="px-5 py-3 text-slate-600">{r.assessmentType}</td>
                <td className="px-5 py-3 text-slate-500 text-xs">
                  {new Date(r.assessmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td className="px-5 py-3 text-center text-slate-600">{r.obtainedMarks} / {r.totalMarks}</td>
                <td className="px-5 py-3 text-center font-semibold text-slate-800">{r.percentageScore.toFixed(1)}%</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${RESULT_STYLE[r.result] ?? "bg-slate-100 text-slate-600"}`}>
                    {r.result}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500">{r.reviewedBy ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>{total} total</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="rounded border border-slate-200 px-3 py-1 hover:bg-slate-50 disabled:opacity-40">← Prev</button>
            <span className="px-3 py-1">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="rounded border border-slate-200 px-3 py-1 hover:bg-slate-50 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </StandardPageLayout>
  );
}

