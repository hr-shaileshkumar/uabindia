"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { getApiErrorMessage } from "@/lib/api-errors";
import { hrApi } from "@/services/hrApi";

type AnnouncementRecord = {
  id: string;
  title: string;
  body: string;
  audience: string;
  status: string;
  updatedAt?: string;
};

const formatDate = (value?: string) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const normalizeValue = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim().length > 0 ? value : fallback;

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");

  const loadAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await hrApi.communication.announcements.list({ page: 1, limit: 24 });
      const raw = response.data;
      const items = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.announcements)
          ? raw.announcements
          : Array.isArray(raw?.records)
            ? raw.records
            : Array.isArray(raw?.data)
              ? raw.data
              : [];

      setAnnouncements(
        items.map((item: Record<string, unknown>, index: number) => ({
          id: String(item.id ?? item.announcementId ?? index),
          title: normalizeValue(item.title, "Untitled announcement"),
          body: normalizeValue(item.body, normalizeValue(item.message, "No announcement body available.")),
          audience: normalizeValue(item.audience, "All Employees"),
          status: normalizeValue(item.status, "Draft"),
          updatedAt:
            typeof item.updatedAt === "string"
              ? item.updatedAt
              : typeof item.publishedAt === "string"
                ? item.publishedAt
                : typeof item.createdAt === "string"
                  ? item.createdAt
                  : undefined,
        }))
      );
    } catch (loadError: unknown) {
      setError(getApiErrorMessage(loadError, "Failed to load announcements."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((announcement) => {
      const matchesStatus = statusFilter === "all" || announcement.status.toLowerCase() === statusFilter;
      const matchesAudience = audienceFilter === "all" || announcement.audience.toLowerCase() === audienceFilter;
      return matchesStatus && matchesAudience;
    });
  }, [announcements, audienceFilter, statusFilter]);

  const availableAudiences = useMemo(() => {
    const values = new Set(
      announcements
        .map((announcement) => announcement.audience.toLowerCase())
        .filter((value) => value.length > 0)
    );
    return Array.from(values);
  }, [announcements]);

  return (
    <StandardPageLayout
      title="Announcements"
      subtitle="Live communication records, audience targeting, and publication state in one workspace feed."
      eyebrow="Workspace / Communication"
      icon="notifications"
      actions={
        <button type="button" onClick={() => void loadAnnouncements()} className="erp-action-btn erp-action-btn-secondary">
          Refresh feed
        </button>
      }
      filters={
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="erp-label">Publication status</label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="erp-select">
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
          <div>
            <label className="erp-label">Audience</label>
            <select value={audienceFilter} onChange={(event) => setAudienceFilter(event.target.value)} className="erp-select">
              <option value="all">All</option>
              {availableAudiences.map((audience) => (
                <option key={audience} value={audience}>
                  {audience
                    .split(/[\s_-]+/)
                    .filter(Boolean)
                    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                    .join(" ")}
                </option>
              ))}
            </select>
          </div>
        </div>
      }
    >
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">Visible Announcements</p>
          <p className="erp-kpi-value">{filteredAnnouncements.length}</p>
          <p className="erp-kpi-meta">Current communication feed</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-success">
          <p className="erp-kpi-label">Published</p>
          <p className="erp-kpi-value erp-kpi-value-success">
            {filteredAnnouncements.filter((announcement) => announcement.status.toLowerCase() === "published").length}
          </p>
          <p className="erp-kpi-meta">Already visible to users</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-warning">
          <p className="erp-kpi-label">Draft</p>
          <p className="erp-kpi-value">
            {filteredAnnouncements.filter((announcement) => announcement.status.toLowerCase() === "draft").length}
          </p>
          <p className="erp-kpi-meta">Still awaiting release</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Audience Groups</p>
          <p className="erp-kpi-value">{availableAudiences.length}</p>
          <p className="erp-kpi-meta">Distinct target segments</p>
        </div>
      </div>

      {error ? <div className="erp-alert-error">{error}</div> : null}

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-5 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          No announcements match the selected filters.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredAnnouncements.map((announcement) => (
            <article key={announcement.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{announcement.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{announcement.body}</p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    announcement.status.toLowerCase() === "published"
                      ? "bg-emerald-100 text-emerald-700"
                      : announcement.status.toLowerCase() === "scheduled"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {announcement.status}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                  Audience: {announcement.audience}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                  Updated: {formatDate(announcement.updatedAt)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </StandardPageLayout>
  );
}
