"use client";

import { useEffect, useState, useCallback } from "react";
import ModuleTablePage from "@/features/shared/components/ModuleTablePage";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";
import { hrApi } from "@/services/hrApi";
import { notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type SmsTemplateRow = { id: string; name: string; message: string; triggerEvent: string; language: string; status: string };

export default function CommunicationSmsTemplatesPage() {
  const [records, setRecords] = useState<SmsTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await hrApi.communication.smsTemplates.list();
      setRecords((res.data?.records ?? res.data?.templates ?? []) as SmsTemplateRow[]);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to load SMS templates");
      setLoadError(msg);
      notifyError(msg, "SMS Templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  return (
    <ModuleTablePage
      title="SMS Templates"
      subtitle="Configure SMS message templates for OTPs, alerts, HR notifications, and employee communications."
      eyebrow="Communication / SMS Templates"
      icon="message"
      toolbarTitle="SMS template library"
      toolbarSubtitle="Manage short message templates with dynamic variable substitution."
      loading={loading}
      loadError={loadError}
      onRetry={loadData}
      rows={records}
      countLabel={(count) => `${count} templates`}
      emptyMessage="No SMS templates found."
      headerStats={
        <ErpHeaderSummary
          items={[
            { label: "Templates", value: records.length },
            {
              label: "Active",
              value: records.filter((record) => record.status === "Active").length,
              tone: "success",
            },
            {
              label: "Draft",
              value: records.filter((record) => record.status === "Draft").length,
              tone: "warning",
            },
            {
              label: "Events",
              value: new Set(records.map((record) => record.triggerEvent).filter(Boolean)).size,
              tone: "info",
            },
          ]}
        />
      }
      columns={[{ label: "Name" }, { label: "Message Preview" }, { label: "Trigger Event" }, { label: "Language" }, { label: "Status" }]}
      renderRow={(r) => (
        <tr key={r.id} className="erp-tr">
          <td className="erp-td text-slate-900">{r.name}</td>
          <td className="erp-td text-slate-600 text-xs max-w-xs truncate">{r.message}</td>
          <td className="erp-td"><span className="erp-chip erp-chip-neutral">{r.triggerEvent}</span></td>
          <td className="erp-td text-slate-600">{r.language}</td>
          <td className="erp-td"><span className={`erp-chip ${r.status === "Active" ? "erp-chip-success" : "erp-chip-warning"}`}>{r.status}</span></td>
        </tr>
      )}
    />
  );
}
