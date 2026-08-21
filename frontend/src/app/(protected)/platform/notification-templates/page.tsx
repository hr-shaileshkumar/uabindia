"use client";

import React, { useMemo, useState } from "react";
import { Bell, Mail, MessageSquare, CheckCircle2 } from "lucide-react";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useNotificationTemplates } from "@/features/platform/hooks/useCommunicationTemplates";

export default function NotificationTemplatesPage() {
  const { templates, isLoading, isError, error, refetch, total } = useNotificationTemplates(1, 100);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || t.key.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
      const matchesChannel = channelFilter === "all" || t.channel.toLowerCase() === channelFilter.toLowerCase();
      return matchesSearch && matchesChannel;
    });
  }, [templates, search, channelFilter]);

  const kpis: KpiMetricItem[] = [
    { label: "Templates", value: total, tone: "info", icon: <Bell className="h-3.5 w-3.5" />, subtext: "Live API" },
    { label: "Email", value: templates.filter((t) => t.channel === "Email").length, tone: "positive", icon: <Mail className="h-3.5 w-3.5" />, subtext: "Email" },
    { label: "SMS", value: templates.filter((t) => t.channel === "SMS").length, tone: "warning", icon: <MessageSquare className="h-3.5 w-3.5" />, subtext: "SMS" },
    { label: "Active", value: templates.filter((t) => t.isActive).length, tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Published" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Notification templates"
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
      onRefresh={() => void refetch()}
      isLoading={isLoading}
      listKey="platform-notification-templates"
      listRows={filteredTemplates}
      listColumns={[
        { key: "key", label: "Template key" },
        { key: "channel", label: "Channel" },
        { key: "subject", label: "Subject" },
        { key: "language", label: "Language" },
        { key: "isActive", label: "Status", dataType: "boolean" },
      ]}
      getRowId={(row) => row.id ?? row.key}
      emptyMessage="No templates found."
      renderListRow={(t) => (
        <tr key={t.id ?? t.key} className="erp-tr">
          <td className="erp-td font-mono text-xs font-semibold">{t.key}</td>
          <td className="erp-td">
            <span className="erp-chip erp-chip-neutral">{t.channel}</span>
          </td>
          <td className="erp-td">{t.subject}</td>
          <td className="erp-td">{t.language}</td>
          <td className="erp-td">
            <span className={t.isActive ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>{t.isActive ? "Active" : "Inactive"}</span>
          </td>
        </tr>
      )}
    >
      {isError ? <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load notification templates.")}</div> : null}
    </PlatformGlobalPageShell>
  );
}
