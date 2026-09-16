"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
﻿
import { useCallback, useEffect, useState } from "react";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { ROUTES } from "@/constants/routes";
import { hrmsApi } from "@/services/modules";
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

function LegacyScreeningSchedulePage() {
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
      const res = await hrmsApi.screenings.getSchedule({
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
      eyebrow="HRMS / Recruitment"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Scheduled", value: rows.length, helper: "sessions" },
            { label: "Pending", value: rows.filter((row) => (row.status || "").toLowerCase() === "scheduled").length, helper: "upcoming", tone: "warning" },
            { label: "Completed", value: rows.filter((row) => (row.status || "").toLowerCase() === "completed").length, helper: "finished", tone: "positive" },
            { label: "Types", value: new Set(rows.map((row) => row.screeningType).filter(Boolean)).size, helper: "distinct", tone: "info" },
          ]}
        />
      }
      filters={
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search candidate, email, job…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="erp-input h-8 w-56 sm:w-64"
          />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="erp-select h-8 w-36"
          >
            <option value="">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="NoShow">No Show</option>
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
          {(search || status || fromDate || toDate) && (
            <button
              type="button"
              onClick={() => { setSearch(""); setStatus(""); setFromDate(""); setToDate(""); setPage(1); }}
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
              {["Candidate", "Job", "Type", "Scheduled", "Interviewer", "Status", "Score"].map((h) => (
                <th key={h} className="erp-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="erp-td py-4">
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                </td></tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="erp-td py-12 text-center text-slate-400">No screenings found.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.screeningId} className="erp-tr">
                <td className="erp-td">
                  <Link href={ROUTES.RECRUITMENT} className="font-medium text-slate-900 hover:underline">
                    {r.candidateName}
                  </Link>
                  <p className="text-xs text-slate-400">{r.candidateEmail}</p>
                </td>
                <td className="erp-td">
                  <span className="font-medium text-slate-800">{r.jobTitle}</span>
                  <p className="text-xs text-slate-400">{r.department}</p>
                </td>
                <td className="erp-td text-slate-600">{r.screeningType}</td>
                <td className="erp-td text-slate-600">
                  {new Date(r.scheduledDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="erp-td text-slate-600">{r.interviewer ?? "—"}</td>
                <td className="erp-td">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${ STATUS_COLORS[r.status] ?? "bg-slate-100 text-slate-600"}` }>
                    {r.status}
                  </span>
                </td>
                <td className="erp-td font-semibold text-slate-700">
                  {r.overallScore > 0 ? `${r.overallScore}/100` : "—"}
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

export default function ScreeningSchedulePage() {
  return (
    <DynamicPage
      pageKey="hrms.screening-schedule"
      fallback={<LegacyScreeningSchedulePage />}
      renderMode="auto"
    />
  );
}
