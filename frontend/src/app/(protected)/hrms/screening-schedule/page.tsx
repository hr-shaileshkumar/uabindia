"use client";

import { useCallback, useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import Link from "next/link";

type ScheduleRow = {
  screeningId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  department: string;
  screeningType: string;
  scheduledDate: string;
  interviewer: string | null;
  status: string;
  overallScore: number;
  completedDate: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  Scheduled:  "bg-blue-100 text-blue-700",
  InProgress: "bg-yellow-100 text-yellow-700",
  Completed:  "bg-green-100 text-green-700",
  Cancelled:  "bg-red-100 text-red-700",
  NoShow:     "bg-gray-100 text-gray-600",
};

export default function ScreeningSchedulePage() {
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const LIMIT = 20;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrApi.screenings.getSchedule({
        search: search || undefined,
        status: status || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page,
        limit: LIMIT,
      });
      setRows(res.data?.schedule ?? []);
      setTotal(res.data?.total ?? 0);
    } catch {
      setError("Failed to load screening schedule.");
    } finally {
      setLoading(false);
    }
  }, [search, status, fromDate, toDate, page]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <StandardPageLayout
      title="Screening Schedule"
      subtitle="All upcoming and past candidate interviews across all job postings."
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <input
            type="text"
            placeholder="Search candidate, email, job…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 w-56"
          />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
          >
            <option value="">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="NoShow">No Show</option>
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
          {(search || status || fromDate || toDate) && (
            <button type="button" onClick={() => { setSearch(""); setStatus(""); setFromDate(""); setToDate(""); setPage(1); }}
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
        <div className="erp-kpi-card"><p className="erp-kpi-label">Total Scheduled</p><p className="erp-kpi-value">{rows.length}</p><p className="erp-kpi-meta">Screening sessions</p></div>
        <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Pending</p><p className="erp-kpi-value">{rows.filter(r => (r.status || '').toLowerCase() === 'scheduled').length}</p><p className="erp-kpi-meta">Upcoming screenings</p></div>
        <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Completed</p><p className="erp-kpi-value erp-kpi-value-success">{rows.filter(r => (r.status || '').toLowerCase() === 'completed').length}</p><p className="erp-kpi-meta">Finished screenings</p></div>
        <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Screening Types</p><p className="erp-kpi-value">{new Set(rows.map(r => r.screeningType).filter(Boolean)).size}</p><p className="erp-kpi-meta">Distinct types</p></div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {["Candidate", "Job", "Type", "Scheduled", "Interviewer", "Status", "Score"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-5 py-3">
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                </td></tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">No screenings found.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.screeningId} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <Link href={`/erp/hrms/recruitment`} className="font-medium text-blue-600 hover:underline">
                    {r.candidateName}
                  </Link>
                  <p className="text-xs text-slate-400">{r.candidateEmail}</p>
                </td>
                <td className="px-5 py-3">
                  <span className="font-medium text-slate-800">{r.jobTitle}</span>
                  <p className="text-xs text-slate-400">{r.department}</p>
                </td>
                <td className="px-5 py-3 text-slate-600">{r.screeningType}</td>
                <td className="px-5 py-3 text-slate-600">
                  {new Date(r.scheduledDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-5 py-3 text-slate-600">{r.interviewer ?? "—"}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ STATUS_COLORS[r.status] ?? "bg-slate-100 text-slate-600"}` }>
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {r.overallScore > 0 ? `${r.overallScore}/100` : "—"}
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

