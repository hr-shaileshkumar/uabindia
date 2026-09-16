"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";

import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AdministrationGlobalPageShell } from "@/components/administration/AdministrationGlobalPageShell";
import { ErpDrawerFooter, ErpRowActions } from "@/components/workspace/page-kit";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { aiApi } from "@/services/modules/ai";
import { mapAiAgent, useAiAgents } from "@/features/administration/hooks/useAiAgents";

function LegacyAiAssistantPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useAiAgents(1, 50);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatAgentKey, setChatAgentKey] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [form, setForm] = useState({
    agentKey: "",
    name: "",
    description: "",
    provider: "OpenAI",
    modelName: "gpt-4o-mini",
    category: "General",
    isEnabled: true,
  });

  const agents = useMemo(() => (data?.data ?? []).map(mapAiAgent), [data?.data]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return agents.filter((row) => {
      const matchesSearch =
        !q || row.name.toLowerCase().includes(q) || row.key.toLowerCase().includes(q) || row.category.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "enabled" && row.status === "Enabled") ||
        (statusFilter === "disabled" && row.status === "Disabled");
      return matchesSearch && matchesStatus;
    });
  }, [agents, search, statusFilter]);

  const upsert = useMutation({
    mutationFn: () =>
      aiApi.agents.upsert({
        agentKey: form.agentKey.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        provider: form.provider.trim() || "OpenAI",
        modelName: form.modelName.trim(),
        category: form.category.trim() || "General",
        isEnabled: form.isEnabled,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["platform", "ai-agents"] });
    },
  });

  const chat = useMutation({
    mutationFn: () => aiApi.chat(chatMessage.trim(), chatAgentKey || undefined),
  });

  const saveAgent = async () => {
    if (!form.agentKey.trim() || !form.name.trim()) {
      notifyError("Agent key and name are required.");
      return;
    }
    try {
      await upsert.mutateAsync();
      notifySuccess("Agent saved.");
      setDrawerOpen(false);
      setForm({
        agentKey: "",
        name: "",
        description: "",
        provider: "OpenAI",
        modelName: "gpt-4o-mini",
        category: "General",
        isEnabled: true,
      });
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save agent."));
    }
  };

  const sendChat = async () => {
    if (!chatMessage.trim()) {
      notifyError("Enter a message.");
      return;
    }
    try {
      const res = await chat.mutateAsync();
      const payload = res.data as { reply?: string; message?: string; data?: { reply?: string } };
      setChatReply(payload.reply ?? payload.data?.reply ?? payload.message ?? JSON.stringify(payload));
      notifySuccess("Reply received.");
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Chat failed."));
    }
  };

  return (
    <AdministrationGlobalPageShell
      title="AI agents"
      categoryTag="Platform"
      icon="bot"
      kpiMetrics={[
        { label: "Agents", value: data?.total ?? agents.length, tone: "info" },
        { label: "Enabled", value: agents.filter((a) => a.status === "Enabled").length, tone: "positive" },
        { label: "Categories", value: new Set(agents.map((a) => a.category)).size, tone: "warning" },
      ]}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Filter agent name or key…"
      filterOptions={[
        {
          key: "status",
          label: "Status",
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { label: "All", value: "all" },
            { label: "Enabled", value: "enabled" },
            { label: "Disabled", value: "disabled" },
          ],
        },
      ]}
      primaryActionLabel="New agent"
      onPrimaryAction={() => setDrawerOpen(true)}
      secondaryActions={[
        {
          label: "Test chat",
          onClick: () => {
            setChatAgentKey(agents[0]?.key ?? "");
            setChatOpen(true);
          },
        },
      ]}
      onRefresh={() => void refetch()}
      isLoading={isLoading}
      listKey="platform-ai-agents"
      listRows={filtered}
      getRowId={(row) => row.id}
      emptyMessage="No AI agents yet. Create an agent to enable copilot chat."
      listColumns={[
        { key: "name", label: "Agent", dataType: "string" },
        { key: "provider", label: "Provider / model", dataType: "string" },
        { key: "category", label: "Category", dataType: "string" },
        { key: "status", label: "Status", dataType: "string" },
        { key: "actions", label: "Actions", locked: true },
      ]}
      renderListRow={(row) => (
        <>
          <td className="erp-td">
            <div className="erp-row-title text-xs">{row.name}</div>
            <div className="font-mono text-[11px] text-slate-500">{row.key}</div>
          </td>
          <td className="erp-td text-xs">
            {row.provider} · {row.model}
          </td>
          <td className="erp-td text-xs">{row.category}</td>
          <td className="erp-td">
            <span className={row.status === "Enabled" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-warning"}>{row.status}</span>
          </td>
          <td className="erp-td">
            <ErpRowActions
              onEdit={{
                label: "Edit",
                onClick: () => {
                  setForm({
                    agentKey: row.key,
                    name: row.name,
                    description: row.description === "-" ? "" : row.description,
                    provider: row.provider,
                    modelName: row.model === "-" ? "" : row.model,
                    category: row.category,
                    isEnabled: row.status === "Enabled",
                  });
                  setDrawerOpen(true);
                },
              }}
              extra={
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                  onClick={() => {
                    setChatAgentKey(row.key);
                    setChatOpen(true);
                  }}
                >
                  Chat
                </button>
              }
            />
          </td>
        </>
      )}
      isInspectorOpen={drawerOpen || chatOpen}
      onInspectorClose={() => {
        setDrawerOpen(false);
        setChatOpen(false);
      }}
      inspectorTitle={chatOpen ? "Test chat" : form.agentKey ? "Upsert agent" : "New agent"}
      inspectorContent={
        chatOpen ? (
          <div className="erp-form-grid">
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Agent key</label>
              <input className="erp-input font-mono" value={chatAgentKey} onChange={(e) => setChatAgentKey(e.target.value)} />
            </div>
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Message *</label>
              <textarea className="erp-input min-h-24" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} />
            </div>
            {chatReply ? (
              <div className="md:col-span-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs whitespace-pre-wrap">{chatReply}</div>
            ) : null}
            <div className="md:col-span-2">
              <ErpDrawerFooter onCancel={() => setChatOpen(false)} onSave={() => void sendChat()} saving={chat.isPending} saveLabel="Send" />
            </div>
          </div>
        ) : (
          <div className="erp-form-grid">
            {isError ? (
              <p className="md:col-span-2 text-xs text-rose-600">{getApiErrorMessage(error, "Failed to load agents.")}</p>
            ) : null}
            <div className="erp-field">
              <label className="erp-label">Agent key *</label>
              <input className="erp-input font-mono" value={form.agentKey} onChange={(e) => setForm((f) => ({ ...f, agentKey: e.target.value }))} />
            </div>
            <div className="erp-field">
              <label className="erp-label">Name *</label>
              <input className="erp-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="erp-field">
              <label className="erp-label">Provider</label>
              <input className="erp-input" value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} />
            </div>
            <div className="erp-field">
              <label className="erp-label">Model</label>
              <input className="erp-input" value={form.modelName} onChange={(e) => setForm((f) => ({ ...f, modelName: e.target.value }))} />
            </div>
            <div className="erp-field">
              <label className="erp-label">Category</label>
              <input className="erp-input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            </div>
            <div className="erp-field md:col-span-2">
              <label className="erp-label">Description</label>
              <input className="erp-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <label className="erp-field flex items-center gap-2 text-xs md:col-span-2">
              <input type="checkbox" checked={form.isEnabled} onChange={(e) => setForm((f) => ({ ...f, isEnabled: e.target.checked }))} />
              Enabled
            </label>
            <div className="md:col-span-2">
              <ErpDrawerFooter onCancel={() => setDrawerOpen(false)} onSave={() => void saveAgent()} saving={upsert.isPending} saveLabel="Save agent" />
            </div>
          </div>
        )
      }
    />
  );
}

export default function AiAssistantPage() {
  return (
    <DynamicPage
      pageKey="administration.ai-assistant"
      fallback={<LegacyAiAssistantPage />}
      renderMode="auto"
    />
  );
}
