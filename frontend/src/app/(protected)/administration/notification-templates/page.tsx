"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";

import React, { useMemo, useState } from "react";
import { Bell, Mail, MessageSquare, CheckCircle2, Plus, Sparkles, Eye, Trash2 } from "lucide-react";
import { AdministrationGlobalPageShell, type KpiMetricItem } from "@/components/administration/AdministrationGlobalPageShell";
import { ErpDrawerFooter, ErpRowActions } from "@/components/workspace/page-kit";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { useNotificationTemplates, useTemplateMutations } from "@/features/administration/hooks/useCommunicationTemplates";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";

const VARIABLE_TAGS = [
  "{{employee_name}}",
  "{{company_name}}",
  "{{action_url}}",
  "{{otp_code}}",
  "{{reference_id}}",
  "{{status}}",
  "{{date}}",
];

function LegacyNotificationTemplatesPage() {
  const { templates, isLoading, isError, error, refetch, total } = useNotificationTemplates(1, 100);
  const { createTemplate, deleteTemplate } = useTemplateMutations();
  const { confirm, confirmDialog } = useConfirmDialog();

  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [mode, setMode] = useState<"closed" | "create" | "view">("closed");
  const [selectedTemplate, setSelectedTemplate] = useState<(typeof templates)[number] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    channel: "Email" as "Email" | "SMS",
    name: "",
    subject: "",
    triggerEvent: "user.notification",
    language: "en-US",
    body: "Hello {{employee_name}},\n\nYour request has been updated.\n\nRegards,\n{{company_name}}",
    status: "Published",
  });

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || t.key.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
      const matchesChannel = channelFilter === "all" || t.channel.toLowerCase() === channelFilter.toLowerCase();
      return matchesSearch && matchesChannel;
    });
  }, [templates, search, channelFilter]);

  const kpis: KpiMetricItem[] = [
    { label: "Total templates", value: total, tone: "info", icon: <Bell className="h-3.5 w-3.5" />, subtext: "Live channels" },
    { label: "Email templates", value: templates.filter((t) => t.channel === "Email").length, tone: "positive", icon: <Mail className="h-3.5 w-3.5" />, subtext: "HTML / Rich" },
    { label: "SMS templates", value: templates.filter((t) => t.channel === "SMS").length, tone: "warning", icon: <MessageSquare className="h-3.5 w-3.5" />, subtext: "DLT compliant" },
    { label: "Active status", value: templates.filter((t) => t.isActive).length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Published" },
  ];

  const handleOpenCreate = () => {
    setSelectedTemplate(null);
    setForm({
      channel: "Email",
      name: "",
      subject: "",
      triggerEvent: "user.notification",
      language: "en-US",
      body: "Hello {{employee_name}},\n\nYour request has been processed.\n\nRegards,\n{{company_name}}",
      status: "Published",
    });
    setMode("create");
  };

  const handleOpenView = (t: (typeof templates)[number]) => {
    setSelectedTemplate(t);
    setForm({
      channel: t.channel,
      name: t.name || t.key,
      subject: t.subject,
      triggerEvent: t.triggerEvent || t.key,
      language: t.language,
      body: t.body || "(No template body stored)",
      status: t.isActive ? "Published" : "Draft",
    });
    setMode("view");
  };

  const handleInsertTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      body: prev.body + " " + tag,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      notifyError("Template name is required");
      return;
    }
    try {
      setSubmitting(true);
      await createTemplate.mutateAsync({
        kind: form.channel,
        name: form.name.trim(),
        subject: form.channel === "Email" ? form.subject.trim() || form.name.trim() : undefined,
        body: form.body.trim(),
        triggerEvent: form.triggerEvent.trim() || undefined,
        language: form.language,
        status: form.status,
      });
      notifySuccess(`${form.channel} template "${form.name}" saved successfully`);
      setMode("closed");
    } catch (err: unknown) {
      notifyError(getApiErrorMessage(err, "Failed to save template"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (t: (typeof templates)[number]) => {
    if (!t.id) return;
    const ok = await confirm({
      title: `Delete ${t.channel} Template`,
      message: `Are you sure you want to delete "${t.name || t.key}"? This action cannot be undone.`,
      confirmText: "Delete Template",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await deleteTemplate.mutateAsync({ kind: t.channel, id: t.id });
      notifySuccess(`Deleted template "${t.name || t.key}"`);
    } catch (err: unknown) {
      notifyError(getApiErrorMessage(err, "Failed to delete template"));
    }
  };

  return (
    <>
      <AdministrationGlobalPageShell
        title="Notification Templates & Channels"
        subtitle="Configure transactional emails, SMS message templates, and automated dispatch triggers."
        categoryTag="Communication Infrastructure"
        icon="bell"
        kpiMetrics={kpis}
        searchPlaceholder="Filter template key or subject..."
        searchValue={search}
        onSearchChange={setSearch}
        filterOptions={[
          {
            key: "channel",
            label: "All Channels",
            value: channelFilter,
            onChange: setChannelFilter,
            options: [
              { label: "All Channels", value: "all" },
              { label: "Email", value: "email" },
              { label: "SMS", value: "sms" },
            ],
          },
        ]}
        onClearFilters={() => {
          setSearch("");
          setChannelFilter("all");
        }}
        primaryActionLabel="New Template"
        onPrimaryAction={handleOpenCreate}
        onRefresh={() => void refetch()}
        isLoading={isLoading}
        listKey="platform-notification-templates"
        listRows={filteredTemplates}
        listColumns={[
          { key: "key", label: "Template Key & Name" },
          { key: "channel", label: "Channel" },
          { key: "subject", label: "Subject / Header" },
          { key: "language", label: "Language" },
          { key: "isActive", label: "Status", dataType: "boolean" },
          { key: "actions", label: "Actions" },
        ]}
        getRowId={(row) => row.id ?? row.key}
        emptyMessage="No notification templates configured. Click 'New Template' to create one."
        renderListRow={(t) => (
          <tr key={t.id ?? t.key} className="erp-tr">
            <td className="erp-td">
              <div className="erp-row-title font-semibold text-slate-900">{t.name || t.key}</div>
              <div className="font-mono text-xs text-slate-500">{t.key}</div>
            </td>
            <td className="erp-td">
              <span className={`erp-chip ${t.channel === "Email" ? "erp-chip-info" : "erp-chip-warning"}`}>
                {t.channel === "Email" ? <Mail className="h-3 w-3 mr-1" /> : <MessageSquare className="h-3 w-3 mr-1" />}
                {t.channel}
              </span>
            </td>
            <td className="erp-td text-sm text-slate-700 max-w-xs truncate">{t.subject}</td>
            <td className="erp-td font-mono text-xs text-slate-600">{t.language}</td>
            <td className="erp-td">
              <span className={t.isActive ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
                {t.isActive ? "Published" : "Draft"}
              </span>
            </td>
            <td className="erp-td text-right">
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenView(t)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <Eye className="h-3.5 w-3.5 inline mr-1 text-slate-500" />
                  Inspect
                </button>
                {t.id && (
                  <button
                    type="button"
                    onClick={() => void handleDelete(t)}
                    className="rounded-lg border border-rose-200 bg-white px-2 py-1 text-xs font-medium text-rose-600 shadow-sm hover:bg-rose-50"
                    title="Delete template"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </td>
          </tr>
        )}
        isInspectorOpen={mode !== "closed"}
        onInspectorClose={() => setMode("closed")}
        inspectorTitle={mode === "view" ? `Inspect Template: ${form.name}` : "Design Notification Template"}
        inspectorContent={
          <form onSubmit={handleSave} className="erp-form-grid">
            <div className="erp-field">
              <label className="erp-label">Channel *</label>
              <select
                className="erp-input"
                value={form.channel}
                disabled={mode === "view"}
                onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value as "Email" | "SMS" }))}
              >
                <option value="Email">Email (HTML & Text)</option>
                <option value="SMS">SMS (Text / DLT)</option>
              </select>
            </div>

            <div className="erp-field">
              <label className="erp-label">Language</label>
              <input
                className="erp-input"
                value={form.language}
                disabled={mode === "view"}
                onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
                placeholder="en-US"
              />
            </div>

            <div className="erp-field md:col-span-2">
              <label className="erp-label">Template Name *</label>
              <input
                className="erp-input"
                value={form.name}
                disabled={mode === "view"}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Leave Approval Notice"
                required
              />
            </div>

            <div className="erp-field md:col-span-2">
              <label className="erp-label">Trigger Event Key</label>
              <input
                className="erp-input font-mono"
                value={form.triggerEvent}
                disabled={mode === "view"}
                onChange={(e) => setForm((f) => ({ ...f, triggerEvent: e.target.value }))}
                placeholder="e.g. hrms.leave.approved"
              />
            </div>

            {form.channel === "Email" && (
              <div className="erp-field md:col-span-2">
                <label className="erp-label">Email Subject Line</label>
                <input
                  className="erp-input"
                  value={form.subject}
                  disabled={mode === "view"}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="e.g. Your Leave Request #{{reference_id}} has been approved"
                />
              </div>
            )}

            <div className="erp-field md:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="erp-label !mb-0">Message Template Body *</label>
                {mode !== "view" && (
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-indigo-500" /> Insert Variable:
                  </span>
                )}
              </div>
              {mode !== "view" && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {VARIABLE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleInsertTag(tag)}
                      className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              )}
              <textarea
                className="erp-input font-mono text-xs min-h-[140px]"
                value={form.body}
                disabled={mode === "view"}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                required
              />
            </div>

            <div className="erp-field md:col-span-2">
              <ErpDrawerFooter
                onCancel={() => setMode("closed")}
                onSave={mode !== "view" ? () => void handleSave({ preventDefault: () => {} } as React.FormEvent) : () => setMode("closed")}
                saveLabel={mode === "view" ? "Close" : submitting ? "Saving..." : "Save Template"}
                saving={submitting}
              />
            </div>
          </form>
        }
      >
        {isError && (
          <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load notification templates.")}</div>
        )}
      </AdministrationGlobalPageShell>
      {confirmDialog}
    </>
  );
}

export default function NotificationTemplatesPage() {
  return (
    <DynamicPage
      pageKey="administration.notification-templates"
      fallback={<LegacyNotificationTemplatesPage />}
      renderMode="auto"
    />
  );
}
