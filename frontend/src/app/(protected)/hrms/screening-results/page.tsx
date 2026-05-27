"use client";

import { useCallback, useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";

type ResultRow = {
  screeningId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  department: string;
  screeningType: string;
  technicalSkillsRating: number;
  communicationRating: number;
  culturalFitRating: number;
  overallScore: number;
  result: string;
  interviewer: string | null;
  completedDate: string;
  comments: string | null;
};

export default function ScreeningResultsPage() {
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [result, setResult] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const LIMIT = 20;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrApi.screenings.getResults({
        search: search || undefined,
        result: result || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page,
        limit: LIMIT,
      });
      setRows(res.data?.results ?? []);
      setTotal(res.data?.total ?? 0);
    } catch {
      setError("Failed to load screening results.");
    } finally {
      setLoading(false);
    }
  }, [search, result, fromDate, toDate, page]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <StandardPageLayout
      title="Screening Results"
      subtitle="Completed candidate screenings with scores and outcomes."
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <input
            type="text"
            placeholder="Search candidate, job…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 w-56"
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
          <div className="flex items-center gap-1">
            <label className="text-xs text-slate-500">From</label>
            <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-slate-500">To</label>
            <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
          </div>
          {(search || result || fromDate || toDate) && (
            <button type="button" onClick={() => { setSearch(""); setResult(""); setFromDate(""); setToDate(""); setPage(1); }}
              className="text-xs text-slate-500 hover:text-slate-800 underline">
              Clear filters
            </button>
          )}
        </div>
      }
    >
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>}

      {/* KPI summary cards */}
      <div className="erp-kpi-grid mb-4">
        <div className="erp-kpi-card"><p className="erp-kpi-label">Total Results</p><p className="erp-kpi-value">{rows.length}</p><p className="erp-kpi-meta">Screening results</p></div>
        <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Passed</p><p className="erp-kpi-value erp-kpi-value-success">{rows.filter(r => (r.result || '').toLowerCase() === 'pass').length}</p><p className="erp-kpi-meta">Candidates passed</p></div>
        <div className="erp-kpi-card erp-kpi-card-danger"><p className="erp-kpi-label">Failed</p><p className="erp-kpi-value erp-kpi-value-danger">{rows.filter(r => (r.result || '').toLowerCase() === 'fail').length}</p><p className="erp-kpi-meta">Candidates failed</p></div>
        <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Avg Score</p><p className="erp-kpi-value">{rows.length > 0 ? (rows.reduce((s, r) => s + (r.overallScore || 0), 0) / rows.length).toFixed(1) : 0}</p><p className="erp-kpi-meta">Average overall score</p></div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {["Candidate", "Job", "Type", "Technical", "Communication", "Cultural", "Score", "Result", "Interviewer", "Completed"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={10} className="px-4 py-3">
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                </td></tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-400">No completed screenings found.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.screeningId} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-800">{r.candidateName}</span>
                  <p className="text-xs text-slate-400">{r.candidateEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-700">{r.jobTitle}</span>
                  <p className="text-xs text-slate-400">{r.department}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{r.screeningType}</td>
                <td className="px-4 py-3 text-center text-slate-600">{r.technicalSkillsRating > 0 ? r.technicalSkillsRating : "—"}</td>
                <td className="px-4 py-3 text-center text-slate-600">{r.communicationRating > 0 ? r.communicationRating : "—"}</td>
                <td className="px-4 py-3 text-center text-slate-600">{r.culturalFitRating > 0 ? r.culturalFitRating : "—"}</td>
                <td className="px-4 py-3 text-center font-semibold text-slate-800">{r.overallScore}/100</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ r.result === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}` }>
                    {r.result}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{r.interviewer ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {new Date(r.completedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
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

