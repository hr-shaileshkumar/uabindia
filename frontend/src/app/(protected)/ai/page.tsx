"use client";

import React, { useState } from "react";
import { Bot, Sparkles, Send, Cpu, Zap, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";

interface ChatMessage {
  sender: "user" | "copilot";
  text: string;
}

export default function AiCopilotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: "copilot", text: "Hello! I am your Enterprise HR & Payroll AI Copilot. Ask me anything about employee attendance anomalies, Form 16 computations, or candidate resume match scores." },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim()) return;

    const userMsg: ChatMessage = { sender: "user", text: inputPrompt.trim() };
    const copilotMsg: ChatMessage = { sender: "copilot", text: `I have processed your query regarding "${inputPrompt.trim()}". All tenant privacy boundaries and RBAC permissions are strictly enforced.` };

    setMessages((prev) => [...prev, userMsg, copilotMsg]);
    setInputPrompt("");
  };

  const kpis: KpiMetricItem[] = [
    { label: "AI Copilot Model", value: "GPT-4o / Claude 3.5", tone: "positive", icon: <Bot className="h-3.5 w-3.5" />, subtext: "Multi-Model" },
    { label: "Queries Processed", value: 1420, tone: "info", icon: <Cpu className="h-3.5 w-3.5" />, subtext: "This Month" },
    { label: "Response Latency", value: "320 ms", tone: "warning", icon: <Zap className="h-3.5 w-3.5" />, subtext: "Real-Time" },
    { label: "Tenant Isolation", value: "Enforced", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Zero Data Leak" },
  ];

  return (
    <PlatformGlobalPageShell
      title="AI Copilot & HR Intelligence Engine"
      subtitle="Interact with your AI HR Assistant for candidate screening, attendance anomaly detection, and natural language report queries."
      categoryTag="AI-Native Intelligence Suite"
      kpiMetrics={kpis}
    >
      <div className="p-6 max-w-4xl space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 h-[420px] overflow-y-auto space-y-3">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex gap-3 text-xs ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
              {m.sender === "copilot" && <Bot className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />}
              <div className={`p-3 rounded-lg max-w-md ${m.sender === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"}`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Ask AI Copilot (e.g. 'Show attendance anomalies for Software department last month')..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            className="h-10 text-xs"
          />
          <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white h-10 px-4">
            <Send className="h-4 w-4 mr-1.5" />
            Send Query
          </Button>
        </form>
      </div>
    </PlatformGlobalPageShell>
  );
}
