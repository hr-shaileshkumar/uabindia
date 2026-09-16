"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
﻿
import { useCallback, useEffect, useState } from "react";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrmsApi } from "@/services/modules";

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

function LegacyScreeningResultsPage() {
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
      const res = await hrmsApi.screenings.getResults({
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
      eyebrow="HRMS / Recruitment"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Results", value: rows.length, helper: "total" },
            { label: "Passed", value: rows.filter((row) => (row.result || "").toLowerCase() === "pass").length, helper: "candidates", tone: "positive" },
            { label: "Failed", value: rows.filter((row) => (row.result || "").toLowerCase() === "fail").length, helper: "candidates", tone: "danger" },
            {
              label: "Avg Score",
              value: rows.length > 0 ? (rows.reduce((sum, row) => sum + (row.overallScore || 0), 0) / rows.length).toFixed(1) : 0,
              tone: "info",
            },
          ]}
        />
      }
      filters={
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search candidate, job…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="erp-input h-8 w-56 sm:w-64"
          />
          <select
            value={result}
            onChange={(e) => { setResult(e.target.value); setPage(1); }}
            className="erp-select h-8 w-36"
          >
            <option value="">All Results</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="erp-input h-8 w-36"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="erp-input h-8 w-36"
            />
          </div>
          {(search || result || fromDate || toDate) && (
            <button
              type="button"
              onClick={() => { setSearch(""); setResult(""); setFromDate(""); setToDate(""); setPage(1); }}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 underline ml-1"
            >
              Clear filters
            </button>
          )}
        </div>
      }
    >
      {error && <div className="erp-alert-error mb-3">{error}</div>}

      <div className="erp-table-wrap">
        <table className="erp-table table-auto">
          <thead className="erp-thead">
            <tr>
              {["Candidate", "Job", "Type", "Technical", "Communication", "Cultural", "Score", "Result", "Interviewer", "Completed"].map((h) => (
                <th key={h} className="erp-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={10} className="erp-td py-4">
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                </td></tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={10} className="erp-td py-12 text-center text-slate-400">No completed screenings found.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.screeningId} className="erp-tr">
                <td className="erp-td">
                  <span className="font-medium text-slate-900">{r.candidateName}</span>
                  <p className="text-xs text-slate-400">{r.candidateEmail}</p>
                </td>
                <td className="erp-td">
                  <span className="font-medium text-slate-800">{r.jobTitle}</span>
                  <p className="text-xs text-slate-400">{r.department}</p>
                </td>
                <td className="erp-td text-slate-600">{r.screeningType}</td>
                <td className="erp-td text-center text-slate-600">{r.technicalSkillsRating > 0 ? r.technicalSkillsRating : "—"}</td>
                <td className="erp-td text-center text-slate-600">{r.communicationRating > 0 ? r.communicationRating : "—"}</td>
                <td className="erp-td text-center text-slate-600">{r.culturalFitRating > 0 ? r.culturalFitRating : "—"}</td>
                <td className="erp-td text-center font-semibold text-slate-900">{r.overallScore}/100</td>
                <td className="erp-td">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${ (r.result || "").toLowerCase() === "pass" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60" : "bg-rose-50 text-rose-700 ring-1 ring-rose-200/60"}` }>
                    {r.result}
                  </span>
                </td>
                <td className="erp-td text-slate-600">{r.interviewer ?? "—"}</td>
                <td className="erp-td text-slate-500 text-xs">
                  {new Date(r.completedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between px-1 text-xs text-slate-600">
          <span>{total} total</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50 disabled:opacity-40"
            >
              ← Prev
            </button>
            <span>{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 hover:bg-slate-50 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </StandardPageLayout>
  );
}

export default function ScreeningResultsPage() {
  return (
    <DynamicPage
      pageKey="hrms.screening-results"
      fallback={<LegacyScreeningResultsPage />}
      renderMode="auto"
    />
  );
}
