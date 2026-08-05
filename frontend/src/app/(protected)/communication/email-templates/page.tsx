"use client";

import { useEffect, useState, useCallback } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type EmailTemplateRow = { id: string; name: string; subject: string; triggerEvent: string; language: string; status: string };

export default function CommunicationEmailTemplatesPage() {
  const [records, setRecords] = useState<EmailTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await hrApi.communication.emailTemplates.list();
      setRecords((res.data?.records ?? res.data?.templates ?? []) as EmailTemplateRow[]);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load email templates");
      setLoadError(msg);
      notifyError(msg, "Email Templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  return (
    <ModuleTablePage
      title="Email Templates"
      subtitle="Design and manage reusable HTML email templates with variable substitution for automated notifications."
      eyebrow="Communication / Email Templates"
      icon="mail"
      toolbarTitle="Email template library"
      toolbarSubtitle="Build branded email templates for onboarding, payroll, HR events, and system notifications."
      loading={loading}
      loadError={loadError}
      onRetry={loadData}
      rows={records}
      countLabel={(count) => `${count} templates`}
      emptyMessage="No email templates found."
      headerStats={
        <ErpHeaderSummary
          items={[
            { label: "Templates", value: records.length },
            { label: "Active", value: records.filter((r) => r.status === "Active").length, tone: "success" },
            { label: "Draft", value: records.filter((r) => r.status === "Draft").length, tone: "warning" },
            { label: "Events", value: new Set(records.map((r) => r.triggerEvent).filter(Boolean)).size, tone: "info" },
          ]}
        />
      }
      columns={[{ label: "Name" }, { label: "Subject" }, { label: "Trigger Event" }, { label: "Language" }, { label: "Status" }]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.name}</td>
          <td className="erp-td text-slate-600">{r.subject}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-neutral">{r.triggerEvent}</span></td>
          <td className="erp-td text-slate-600">{r.language}</td>
          <td className="erp-td"><span className={`erp-chip ${r.status === "Active" ? "erp-chip-success" : "erp-chip-warning"}`}>{r.status}</span></td>
        </tr>
      )}
    />
  );
}
