"use client";

import React, { useState } from "react";
import { Bot, Plus, Eye, Sparkles, Cpu, Zap, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface AiAgentRow {
  id: string;
  name: string;
  provider: string;
  model: string;
  purpose: string;
  tokenCount: number;
  status: "Active" | "Disabled";
}

const SEED_AGENTS: AiAgentRow[] = [
  { id: "ai_1", name: "Financial Audit Assistant", provider: "OpenAI", model: "gpt-4o", purpose: "Automated general ledger discrepancy checking & anomaly detection", tokenCount: 420000, status: "Active" },
  { id: "ai_2", name: "Resume Parser Agent", provider: "Anthropic", model: "claude-3-5-sonnet", purpose: "Extract candidate skills & experience into HRMS applicant profiles", tokenCount: 180000, status: "Active" },
  { id: "ai_3", name: "Procurement Reorder Predictor", provider: "Google Gemini", model: "gemini-1.5-pro", purpose: "Forecast inventory reorder points from historical sales orders", tokenCount: 290000, status: "Active" },
];

export default function AiAssistantPage() {
  const [agents, setAgents] = useState<AiAgentRow[]>(SEED_AGENTS);
  const [search, setSearch] = useState("");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AiAgentRow | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("OpenAI");
  const [model, setModel] = useState("gpt-4o");
  const [purpose, setPurpose] = useState("");

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newA: AiAgentRow = {
      id: `ai_${Date.now()}`,
      name: name.trim(),
      provider,
      model,
      purpose: purpose.trim() || "Autonomous enterprise agent",
      tokenCount: 0,
      status: "Active",
    };

    setAgents((prev) => [newA, ...prev]);
    setIsDrawerOpen(false);
    setName("");
    setPurpose("");
    notifySuccess(`AI Agent "${newA.name}" provisioned successfully.`);
  };

  const filteredAgents = agents.filter((a) => {
    const q = search.toLowerCase();
    return !q || a.name.toLowerCase().includes(q) || a.provider.toLowerCase().includes(q) || a.model.toLowerCase().includes(q);
  });

  const kpis: KpiMetricItem[] = [
    { label: "Active AI Agents", value: agents.length, tone: "positive", icon: <Bot className="h-3.5 w-3.5" />, subtext: "Autonomous" },
    { label: "LLM Providers", value: new Set(agents.map((a) => a.provider)).size, tone: "info", icon: <Cpu className="h-3.5 w-3.5" />, subtext: "Multi-Model" },
    { label: "Token Consumption", value: `${(agents.reduce((acc, a) => acc + a.tokenCount, 0) / 1000).toFixed(0)}k Tokens`, tone: "warning", icon: <Zap className="h-3.5 w-3.5" />, subtext: "Usage" },
    { label: "AI Security Policy", value: "Enforced", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Role-Gated" },
  ];

  return (
    <PlatformGlobalPageShell
      title="AI Configuration, Agents & LLM Providers"
      subtitle="Manage AI model providers (OpenAI, Gemini, Anthropic), prompt templates, agent permissions, and token analytics."
      categoryTag="AI-Native Platform Engine"
      kpiMetrics={kpis}
      searchPlaceholder="Filter agent name, LLM provider, or model..."
      searchValue={search}
      onSearchChange={setSearch}
      primaryActionLabel="Provision AI Agent"
      onPrimaryAction={() => setIsDrawerOpen(true)}
      primaryActionIcon={<Plus className="h-4 w-4 mr-1.5" />}
      isInspectorOpen={isDrawerOpen || !!selectedAgent}
      onInspectorClose={() => {
        setIsDrawerOpen(false);
        setSelectedAgent(null);
      }}
      inspectorTitle={selectedAgent ? `Agent: ${selectedAgent.name}` : "Provision Enterprise AI Agent"}
      inspectorSubTitle={selectedAgent ? `Model ${selectedAgent.model}` : "Map LLM model providers and prompt templates."}
      inspectorContent={
        selectedAgent ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Agent Name:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedAgent.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">LLM Provider:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedAgent.provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Model Version:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">{selectedAgent.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tokens Processed:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedAgent.tokenCount.toLocaleString()} Tokens</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Operational Purpose:</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedAgent.purpose}</p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedAgent(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateAgent} className="space-y-4 text-xs">
            <div className="space-y-2">
              <Label className="text-xs">AI Agent Name *</Label>
              <Input placeholder="Invoice Anomaly Detector" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">LLM Provider</Label>
                <select className="erp-select text-xs" value={provider} onChange={(e) => setProvider(e.target.value)}>
                  <option value="OpenAI">OpenAI</option>
                  <option value="Google Gemini">Google Gemini</option>
                  <option value="Anthropic">Anthropic</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Model Version</Label>
                <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="gpt-4o" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Operational Purpose</Label>
              <Input placeholder="Detect duplicate supplier invoices before ledger post" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2 pt-6">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Provision Agent
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
              <th className="erp-th">AI Agent Name</th>
              <th className="erp-th">LLM Provider</th>
              <th className="erp-th">Model Version</th>
              <th className="erp-th">Token Usage</th>
              <th className="erp-th">Status</th>
              <th className="erp-th text-right">Inspect</th>
            </tr>
          </thead>
          <tbody>
            {filteredAgents.map((a) => (
              <tr key={a.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Bot className="h-4 w-4 text-indigo-500" />
                  {a.name}
                </td>
                <td className="erp-td">
                  <Badge variant="outline" className="text-xs font-normal">
                    {a.provider}
                  </Badge>
                </td>
                <td className="erp-td font-mono text-xs text-indigo-600 dark:text-indigo-400">{a.model}</td>
                <td className="erp-td font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {(a.tokenCount / 1000).toFixed(0)}k Tokens
                </td>
                <td className="erp-td">
                  <span className={a.status === "Active" ? "erp-chip erp-chip-success" : "erp-chip erp-chip-neutral"}>
                    {a.status}
                  </span>
                </td>
                <td className="erp-td text-right">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-indigo-600" onClick={() => setSelectedAgent(a)}>
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
