"use client";

import { useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";

interface ContactSubmissionRow {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  companyName?: string;
  subject?: string;
  message: string;
  source?: string;
  isResolved: boolean;
  createdAt: string;
}

const truncate = (value: string, max = 120) =>
  value.length > max ? `${value.slice(0, max)}...` : value;

export default function ContactSubmissionsPage() {
  const { confirm, confirmDialog } = useConfirmDialog();
  const [submissions, setSubmissions] = useState<ContactSubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await hrApi.platform.contactSubmissions.list();
        setSubmissions(res.data?.submissions || []);
        setError(null);
      } catch (err) {
        const message = getApiErrorMessage(err, "Failed to load submissions");
        setError(message);
        notifyError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const unresolvedCount = useMemo(
    () => submissions.filter((item) => !item.isResolved).length,
    [submissions]
  );

  const handleToggle = async (row: ContactSubmissionRow) => {
    const nextAction = row.isResolved ? "Reopen" : "Mark Resolved";
    const ok = await confirm({
      title: `${nextAction} submission`,
      message: `${nextAction} contact request from \"${row.name}\"?`,
      confirmText: nextAction,
    });
    if (!ok) return;

    try {
      setUpdatingId(row.id);
      await hrApi.platform.contactSubmissions.update(row.id, {
        isResolved: !row.isResolved,
      });
      setSubmissions((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, isResolved: !row.isResolved } : item
        )
      );
      notifySuccess(row.isResolved ? "Submission reopened." : "Submission marked resolved.");
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to update submission");
      setError(message);
      notifyError(message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <StandardPageLayout
      title="Contact Submissions"
      subtitle="Track incoming support requests and public contact traffic."
      eyebrow="Administration / Service Intake"
      icon="file"
      actions={
        <span className="erp-toolbar-badge">
          {loading ? "Loading..." : `${submissions.length} submissions · ${unresolvedCount} open`}
        </span>
      }
    >
      {confirmDialog}

      {/* KPI summary cards */}
      <div className="erp-kpi-grid mb-4">
        <div className="erp-kpi-card"><p className="erp-kpi-label">Total Submissions</p><p className="erp-kpi-value">{submissions.length}</p><p className="erp-kpi-meta">All contact requests</p></div>
        <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Open</p><p className="erp-kpi-value">{unresolvedCount}</p><p className="erp-kpi-meta">Awaiting resolution</p></div>
        <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Resolved</p><p className="erp-kpi-value erp-kpi-value-success">{submissions.length - unresolvedCount}</p><p className="erp-kpi-meta">Handled requests</p></div>
        <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Resolution Rate</p><p className="erp-kpi-value">{submissions.length > 0 ? Math.round(((submissions.length - unresolvedCount) / submissions.length) * 100) : 0}%</p><p className="erp-kpi-meta">Closure efficiency</p></div>
      </div>

      {error && <div className="erp-alert-error mb-4">{error}</div>}

      <div className="erp-panel">
        <div className="erp-table-toolbar">
          <div>
            <div className="erp-table-title">Submission queue</div>
            <div className="erp-table-subtitle">Triage inbound enquiries, service requests, and public contact activity from a single operator board.</div>
          </div>
          <span className="erp-toolbar-badge">{loading ? "Loading..." : `${submissions.length} submissions`}</span>
        </div>
        <div className="erp-table-wrap rounded-none border-0 shadow-none">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Requester</th>
                <th className="erp-th">Company</th>
                <th className="erp-th">Subject</th>
                <th className="erp-th">Message</th>
                <th className="erp-th">Created</th>
                <th className="erp-th">Status</th>
                <th className="erp-th">Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((row) => (
                <tr key={row.id} className="erp-tr">
                  <td className="erp-td">
                    <div className="erp-row-title">{row.name}</div>
                    <div className="erp-row-meta">
                      <a className="hover:text-slate-700" href={`mailto:${row.email}`}>
                        {row.email}
                      </a>
                      {row.phoneNumber ? ` · ${row.phoneNumber}` : ""}
                    </div>
                  </td>
                  <td className="erp-td">
                    <div className="erp-row-title text-sm">{row.companyName || "-"}</div>
                    <div className="erp-row-meta">{row.source || "public"}</div>
                  </td>
                  <td className="erp-td">{row.subject || "General"}</td>
                  <td className="erp-td text-slate-600">{truncate(row.message)}</td>
                  <td className="erp-td text-xs text-slate-500">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="erp-td">
                    <span className={row.isResolved ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>
                      {row.isResolved ? "Resolved" : "Open"}
                    </span>
                  </td>
                  <td className="erp-td">
                    <button
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => handleToggle(row)}
                      disabled={updatingId === row.id}
                    >
                      {row.isResolved ? "Reopen" : "Mark Resolved"}
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && submissions.length === 0 && (
                <tr>
                  <td colSpan={7} className="erp-td py-8 text-center text-slate-500">
                    No contact submissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </StandardPageLayout>
  );
}
