"use client";

import React, { useState } from "react";
import { Bell, Plus, Eye, Mail, MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface NotificationTemplateRow {
  id: string;
  key: string;
  channel: "Email" | "SMS" | "Push" | "In-App";
  subject: string;
  language: string;
  isActive: boolean;
}

const SEED_TEMPLATES: NotificationTemplateRow[] = [
  { id: "nt_1", key: "TENANT_WELCOME_EMAIL", channel: "Email", subject: "Welcome to UAB India ERP Platform, {{tenantName}}!", language: "en-US", isActive: true },
  { id: "nt_2", key: "USER_INVITE_EMAIL", channel: "Email", subject: "You've been invited to join {{companyName}}", language: "en-US", isActive: true },
  { id: "nt_3", key: "PASSWORD_RESET_SMS", channel: "SMS", subject: "Your OTP password reset code is {{otpCode}}", language: "en-US", isActive: true },
  { id: "nt_4", key: "SALES_ORDER_APPROVED_PUSH", channel: "Push", subject: "Sales Order #{{orderNo}} Approved", language: "en-US", isActive: true },
];

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<NotificationTemplateRow[]>(SEED_TEMPLATES);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplateRow | null>(null);

  // Form State
  const [keyName, setKeyName] = useState("");
  const [channel, setChannel] = useState<NotificationTemplateRow["channel"]>("Email");
  const [subject, setSubject] = useState("");

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    const newT: NotificationTemplateRow = {
      id: `nt_${Date.now()}`,
      key: keyName.trim().toUpperCase(),
      channel,
      subject: subject.trim() || "Notification Alert",
      language: "en-US",
      isActive: true,
    };

    setTemplates((prev) => [...prev, newT]);
    setIsDrawerOpen(false);
    setKeyName("");
    setSubject("");
    notifySuccess(`Notification template "${newT.key}" created.`);
  };

  const filteredTemplates = templates.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || t.key.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
    const matchesChannel = channelFilter === "all" || t.channel.toLowerCase() === channelFilter.toLowerCase();
    return matchesSearch && matchesChannel;
  });

  const kpis: KpiMetricItem[] = [
    { label: "Notification Templates", value: templates.length, tone: "info", icon: <Bell className="h-3.5 w-3.5" />, subtext: "Templates" },
    { label: "Email Templates", value: templates.filter((t) => t.channel === "Email").length, tone: "positive", icon: <Mail className="h-3.5 w-3.5" />, subtext: "Email Gateway" },
    { label: "SMS / Push Alerts", value: templates.filter((t) => t.channel === "SMS" || t.channel === "Push").length, tone: "warning", icon: <MessageSquare className="h-3.5 w-3.5" />, subtext: "Real-time" },
    { label: "Active Dispatchers", value: templates.filter((t) => t.isActive).length, tone: "positive", icon: <Send className="h-3.5 w-3.5" />, subtext: "Active" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Notification Templates & Dispatch Rules"
      subtitle="Manage multi-channel notification templates (Email, SMS, Push) with variable token substitution."
      categoryTag="Communication Engine"
      kpiMetrics={kpis}
      searchPlaceholder="Filter template key, channel, or subject..."
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
            { label: "Push", value: "push" },
          ],
        },
      ]}
      onClearFilters={() => {
        setSearch("");
        setChannelFilter("all");
      }}
      primaryActionLabel="New Template"
      onPrimaryAction={() => setIsDrawerOpen(true)}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
      isInspectorOpen={isDrawerOpen || !!selectedTemplate}
      onInspectorClose={() => {
        setIsDrawerOpen(false);
        setSelectedTemplate(null);
      }}
      inspectorTitle={selectedTemplate ? `Template: ${selectedTemplate.key}` : "Create Notification Template"}
      inspectorSubTitle={selectedTemplate ? `Channel ${selectedTemplate.channel}` : "Add template subject and Token placeholders."}
      inspectorContent={
        selectedTemplate ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Event Key:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedTemplate.key}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Channel:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedTemplate.channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subject / Header:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedTemplate.subject}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => notifySuccess(`Test dispatch sent via ${selectedTemplate.channel}.`)}>
                <Send className="h-3.5 w-3.5 mr-1" />
                Test Dispatch
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedTemplate(null)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateTemplate} className="space-y-4 text-xs">
            <div className="space-y-2">
              <Label className="text-xs">Event Template Key *</Label>
              <Input placeholder="INVOICE_OVERDUE_ALERT" value={keyName} onChange={(e) => setKeyName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Channel</Label>
              <select className="erp-select text-xs" value={channel} onChange={(e) => setChannel(e.target.value as NotificationTemplateRow["channel"])}>
                <option value="Email">Email</option>
                <option value="SMS">SMS</option>
                <option value="Push">Push Notification</option>
                <option value="In-App">In-App Banner</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Subject / Header Template</Label>
              <Input placeholder="Invoice #{{invoiceNo}} is overdue" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2 pt-6">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Create Template
              </Button>
            </div>
          </form>
        )
      }
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Template Key</th>
              <th className="erp-th">Channel</th>
              <th className="erp-th">Subject Line / Template Header</th>
              <th className="erp-th">Language</th>
              <th className="erp-th">Status</th>
              <th className="erp-th text-right">Inspect</th>
            </tr>
          </thead>
          <tbody>
            {filteredTemplates.map((t) => (
              <tr key={t.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-indigo-500" />
                  {t.key}
                </td>
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {t.channel}
                  </Badge>
                </td>
                <td className="erp-td text-xs text-slate-700 dark:text-slate-300 font-medium">{t.subject}</td>
                <td className="erp-td font-mono text-xs text-slate-500">{t.language}</td>
                <td className="erp-td">
                  <span className={t.isActive ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
                    {t.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="erp-td text-right">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600" onClick={() => setSelectedTemplate(t)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
