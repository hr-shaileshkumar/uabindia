"use client";

import { useEffect, useState, useCallback } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type AnnouncementRow = { id: string; title: string; audience: string; publishedBy: string; publishedAt: string; status: string };

export default function CommunicationAnnouncementsPage() {
  const [records, setRecords] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await hrApi.communication.announcements.list();
      setRecords((res.data?.records ?? res.data?.announcements ?? []) as AnnouncementRow[]);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load announcements");
      setLoadError(msg);
      notifyError(msg, "Announcements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  return (
    <ModuleTablePage
      title="Announcements"
      subtitle="Broadcast company-wide or targeted announcements to employees across all departments."
      eyebrow="Communication / Announcements"
      icon="megaphone"
      toolbarTitle="Announcement board"
      toolbarSubtitle="Draft, schedule, and publish internal announcements with audience targeting."
      loading={loading}
      loadError={loadError}
      onRetry={loadData}
      rows={records}
      countLabel={(count) => `${count} announcements`}
      emptyMessage="No announcements found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Total</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">All announcements</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Published</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Published").length}</p><p className="erp-kpi-meta">Live now</p></div>
          <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Draft</p><p className="erp-kpi-value">{records.filter(r => r.status === "Draft").length}</p><p className="erp-kpi-meta">Unpublished</p></div>
        </div>
      }
      columns={[{ label: "Title" }, { label: "Audience" }, { label: "Published By" }, { label: "Published At" }, { label: "Status" }]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.title}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-neutral">{r.audience}</span></td>
          <td className="erp-td text-slate-600">{r.publishedBy}</td>
          <td className="erp-td text-slate-600 text-xs">{r.publishedAt || "-"}</td>
          <td className="erp-td"><span className={`erp-chip ${r.status === "Published" ? "erp-chip-success" : "erp-chip-warning"}`}>{r.status}</span></td>
        </tr>
      )}
    />
  );
}
