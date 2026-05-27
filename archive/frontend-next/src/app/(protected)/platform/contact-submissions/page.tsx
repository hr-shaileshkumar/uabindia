"use client";

import { useEffect, useMemo, useState } from "react";
import { hrApi } from "@/lib/hrApi";

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
        setError((err as Error).message || "Failed to load submissions");
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
    } catch (err) {
      setError((err as Error).message || "Failed to update submission");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Contact Submissions</h2>
        <p className="text-sm text-gray-500">
          Track incoming support requests from public pages.
        </p>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 text-sm text-gray-600">
          <span>
            {loading
              ? "Loading..."
              : `${submissions.length} submissions · ${unresolvedCount} open`}
          </span>
          {error && <span className="text-rose-600">{error}</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Requester</th>
                <th className="px-4 py-2 text-left">Company</th>
                <th className="px-4 py-2 text-left">Subject</th>
                <th className="px-4 py-2 text-left">Message</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{row.name}</div>
                    <div className="text-xs text-gray-500">
                      <a className="hover:text-gray-700" href={`mailto:${row.email}`}>
                        {row.email}
                      </a>
                      {row.phoneNumber ? ` · ${row.phoneNumber}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900">{row.companyName || "-"}</div>
                    <div className="text-xs text-gray-500">{row.source || "public"}</div>
                  </td>
                  <td className="px-4 py-3">{row.subject || "General"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {truncate(row.message)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        row.isResolved
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {row.isResolved ? "Resolved" : "Open"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
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
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    No contact submissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
