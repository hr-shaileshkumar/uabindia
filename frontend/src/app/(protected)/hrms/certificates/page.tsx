"use client";

import { useCallback, useEffect, useState } from "react";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";

type CertificateRow = {
  id: string;
  enrollmentId: string;
  courseTitle: string;
  courseCategory: string;
  certificateNumber: string;
  title: string;
  issuedDate: string;
  expiryDate: string | null;
  isExpired: boolean;
  finalScore: number;
  digitalCertificateUrl: string | null;
  notes: string | null;
};

export default function CertificatesPage() {
  const [rows, setRows] = useState<CertificateRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [expired, setExpired] = useState("all");

  const LIMIT = 20;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrApi.training.getCertificates({
        search: search || undefined,
        expired: expired === "all" ? undefined : expired === "expired",
        page,
        limit: LIMIT,
      });
      setRows(res.data?.certificates ?? []);
      setTotal(res.data?.total ?? 0);
    } catch {
      setError("Failed to load certificates.");
    } finally {
      setLoading(false);
    }
  }, [search, expired, page]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <StandardPageLayout
      title="Training Certificates"
      subtitle="Certificates issued to employees upon course completion."
      meta={
        <ErpHeaderSummary
          items={[
            { label: "Certificates", value: rows.length },
            { label: "Active", value: rows.filter((row) => !row.isExpired).length, tone: "success" },
            { label: "Expired", value: rows.filter((row) => row.isExpired).length, tone: "danger" },
            { label: "Courses", value: new Set(rows.map((row) => row.courseTitle).filter(Boolean)).size, tone: "info" },
          ]}
        />
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <input
            type="text"
            placeholder="Search certificate #, title, course…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 w-64"
          />
          <select
            value={expired}
            onChange={(e) => { setExpired(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
          {(search || expired !== "all") && (
            <button type="button" onClick={() => { setSearch(""); setExpired("all"); setPage(1); }}
              className="text-xs text-slate-500 hover:text-slate-800 underline">Clear filters</button>
          )}
        </div>
      }
    >
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {["Certificate #", "Title", "Course", "Issued", "Expires", "Score", "Status", "Download"].map((h) => (
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
              <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400">No certificates found.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700">{r.certificateNumber}</td>
                <td className="px-5 py-3 font-medium text-slate-800">{r.title}</td>
                <td className="px-5 py-3">
                  <span className="text-slate-700">{r.courseTitle}</span>
                  <p className="text-xs text-slate-400">{r.courseCategory}</p>
                </td>
                <td className="px-5 py-3 text-slate-500 text-xs">
                  {new Date(r.issuedDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td className="px-5 py-3 text-slate-500 text-xs">
                  {r.expiryDate
                    ? new Date(r.expiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                    : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3 text-center font-semibold text-slate-700">
                  {r.finalScore > 0 ? `${r.finalScore}%` : "—"}
                </td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ r.isExpired ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}` }>
                    {r.isExpired ? "Expired" : "Active"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {r.digitalCertificateUrl ? (
                    <a href={r.digitalCertificateUrl} target="_blank" rel="noreferrer"
                      className="text-blue-600 hover:underline text-xs">↓ View</a>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
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

