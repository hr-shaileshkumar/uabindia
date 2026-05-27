"use client";

import { useEffect, useState, useCallback } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type FaqRow = { id: string; question: string; category: string; views: number; helpful: number; status: string };

export default function HelpdeskFaqPage() {
  const [records, setRecords] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await hrApi.helpdesk.faq.list();
      setRecords((res.data?.records ?? res.data?.faqs ?? []) as FaqRow[]);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load FAQ articles");
      setLoadError(msg);
      notifyError(msg, "FAQ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  return (
    <ModuleTablePage
      title="FAQ"
      subtitle="Build and manage a self-service knowledge base to help employees resolve common issues without raising tickets."
      eyebrow="Helpdesk / FAQ"
      icon="help"
      toolbarTitle="Knowledge base"
      toolbarSubtitle="Create searchable FAQs organized by category to reduce support ticket volume."
      loading={loading}
      loadError={loadError}
      onRetry={loadData}
      rows={records}
      countLabel={(count) => `${count} articles`}
      emptyMessage="No FAQ articles found."
      kpiCards={
        <div className="erp-kpi-grid">
          <div className="erp-kpi-card"><p className="erp-kpi-label">Articles</p><p className="erp-kpi-value">{records.length}</p><p className="erp-kpi-meta">Total FAQs</p></div>
          <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Published</p><p className="erp-kpi-value erp-kpi-value-success">{records.filter(r => r.status === "Published").length}</p><p className="erp-kpi-meta">Live</p></div>
          <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Total Views</p><p className="erp-kpi-value">{records.reduce((a, r) => a + r.views, 0)}</p><p className="erp-kpi-meta">All time</p></div>
        </div>
      }
      columns={[{ label: "Question" }, { label: "Category" }, { label: "Views" }, { label: "Helpful" }, { label: "Status" }]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.question}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-neutral">{r.category}</span></td>
          <td className="erp-td text-slate-600">{r.views}</td>
          <td className="erp-td text-slate-600">{r.helpful}</td>
          <td className="erp-td"><span className={`erp-chip ${r.status === "Published" ? "erp-chip-success" : "erp-chip-warning"}`}>{r.status}</span></td>
        </tr>
      )}
    />
  );
}
