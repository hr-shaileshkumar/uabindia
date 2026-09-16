"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";
﻿
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

function LegacyCertificatesPage() {
  const [rows, setRows] = useState<CertificateRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expired, setExpired] = useState("all");
  const [viewRow, setViewRow] = useState<CertificateRow | null>(null);

  const LIMIT = 20;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrmsApi.training.getCertificates({
        search: search || undefined,
        expired: expired === "all" ? undefined : expired === "expired",
        page,
        limit: LIMIT,
      });
      setRows(res.data?.certificates ?? []);
      setTotal(res.data?.total ?? 0);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load certificates."));
    } finally {
      setLoading(false);
    }
  }, [search, expired, page]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(total / LIMIT) || 1;

  return (
    <StandardPageLayout
      title="Training Certificates"
      subtitle="Issue, store, verify, and monitor validity for workforce training and skill certifications."
      eyebrow="HRMS / Learning"
      icon="award"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Certificates", value: total || rows.length },
            { label: "Active", value: rows.filter((row) => !row.isExpired).length, tone: "positive" },
            { label: "Expired", value: rows.filter((row) => row.isExpired).length, tone: "danger" },
            {
              label: "Courses",
              value: new Set(rows.map((row) => row.courseTitle).filter(Boolean)).size,
              tone: "info",
            },
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
            placeholder="Search certificate #, title, course…"
          />
          <div>
            <label className="erp-label">Status</label>
            <select
              className="erp-select w-36"
              value={expired}
              onChange={(e) => {
                setExpired(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
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
                <th className="erp-th">Certificate #</th>
                <th className="erp-th">Title</th>
                <th className="erp-th">Course</th>
                <th className="erp-th">Issued</th>
                <th className="erp-th">Expires</th>
                <th className="erp-th">Score</th>
                <th className="erp-th">Status</th>
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
                    <ErpEmptyState message="No certificates found." />
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="erp-tr">
                    <td className="erp-td font-mono text-xs font-semibold text-slate-700">{r.certificateNumber}</td>
                    <td className="erp-td font-medium text-slate-800">{r.title}</td>
                    <td className="erp-td">
                      <span className="text-slate-700">{r.courseTitle}</span>
                      <p className="text-xs text-slate-400">{r.courseCategory}</p>
                    </td>
                    <td className="erp-td text-xs text-slate-500">
                      {new Date(r.issuedDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="erp-td text-xs text-slate-500">
                      {r.expiryDate
                        ? new Date(r.expiryDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="erp-td font-semibold text-slate-700">
                      {r.finalScore > 0 ? `${r.finalScore}%` : "—"}
                    </td>
                    <td className="erp-td">
                      <span className={r.isExpired ? "erp-chip erp-chip-danger" : "erp-chip erp-chip-success"}>
                        {r.isExpired ? "Expired" : "Active"}
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

      <SideDrawer open={Boolean(viewRow)} onClose={() => setViewRow(null)} title="Certificate details">
        {viewRow ? (
          <div className="erp-form-grid">
            <div className="erp-field">
              <label className="erp-label">Certificate #</label>
              <p className="font-mono text-sm text-slate-800">{viewRow.certificateNumber}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Status</label>
              <p className="text-sm text-slate-800">{viewRow.isExpired ? "Expired" : "Active"}</p>
            </div>
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Title</label>
              <p className="text-sm text-slate-800">{viewRow.title}</p>
            </div>
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Course</label>
              <p className="text-sm text-slate-800">
                {viewRow.courseTitle}
                {viewRow.courseCategory ? ` · ${viewRow.courseCategory}` : ""}
              </p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Issued</label>
              <p className="text-sm text-slate-800">{new Date(viewRow.issuedDate).toLocaleDateString("en-IN")}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Expires</label>
              <p className="text-sm text-slate-800">
                {viewRow.expiryDate ? new Date(viewRow.expiryDate).toLocaleDateString("en-IN") : "—"}
              </p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Score</label>
              <p className="text-sm text-slate-800">{viewRow.finalScore > 0 ? `${viewRow.finalScore}%` : "—"}</p>
            </div>
            <div className="erp-field">
              <label className="erp-label">Download</label>
              {viewRow.digitalCertificateUrl ? (
                <a
                  href={viewRow.digitalCertificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Open certificate
                </a>
              ) : (
                <p className="text-sm text-slate-500">—</p>
              )}
            </div>
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Notes</label>
              <p className="text-sm text-slate-800">{viewRow.notes ?? "—"}</p>
            </div>
          </div>
        ) : null}
      </SideDrawer>
    </StandardPageLayout>
  );
}

export default function CertificatesPage() {
  return (
    <DynamicPage
      pageKey="hrms.certificates"
      fallback={<LegacyCertificatesPage />}
      renderMode="auto"
    />
  );
}
