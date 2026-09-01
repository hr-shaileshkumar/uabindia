"use client";

import React, { useRef, useState } from "react";
import { Bot, Eraser, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { erpButtonClassName } from "@/components/workspace/styles";
import { aiApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";

interface ChatMessage {
  sender: "user" | "copilot";
  text: string;
  citations?: unknown[];
  isError?: boolean;
}

const WELCOME: ChatMessage = {
  sender: "copilot",
  text: "Hello — I am the tenant-grounded ERP copilot. Ask about employees, leave, CRM leads, quotations, or invoices. Answers use live data for your current tenant.",
};

export default function AiCopilotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [agentLabel, setAgentLabel] = useState("Grounded tools");
  const [lastError, setLastError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const clearChat = () => {
    setMessages([WELCOME]);
    setLastError(null);
    setInputPrompt("");
    setAgentLabel("Grounded tools");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || sending) return;

    const prompt = inputPrompt.trim();
    setInputPrompt("");
    setLastError(null);
    setMessages((prev) => [...prev, { sender: "user", text: prompt }]);
    setSending(true);

    try {
      const response = await aiApi.chat(prompt);
      const payload = response.data?.data ?? response.data;
      const reply = String(payload?.reply ?? "No reply returned.");
      const citations = Array.isArray(payload?.citations) ? payload.citations : [];
      if (payload?.agent?.name) {
        setAgentLabel(String(payload.agent.name));
      }
      setMessages((prev) => [...prev, { sender: "copilot", text: reply, citations }]);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    } catch (err) {
      const message = getApiErrorMessage(err, "Copilot could not answer that request.");
      setLastError(message);
      setMessages((prev) => [...prev, { sender: "copilot", text: message, isError: true }]);
    } finally {
      setSending(false);
    }
  };

  const userCount = messages.filter((m) => m.sender === "user").length;
  const isEmptyThread = userCount === 0;

  const stats = [
    { label: "Mode", value: agentLabel, tone: "positive" as const },
    { label: "Messages", value: userCount, tone: "info" as const },
    { label: "Tenant isolation", value: "Enforced", tone: "neutral" as const },
  ];

  return (
    <StandardPageLayout
      title="AI Copilot"
      subtitle="Interact with your enterprise assistant for cross-module queries, summaries, and action automation."
      eyebrow="Platform / Intelligence"
      icon="grid"
      meta={<CrudHeaderStats items={stats} />}
      actions={
        <button
          type="button"
          onClick={clearChat}
          disabled={sending || isEmptyThread}
          className={erpButtonClassName.secondary}
        >
          <Eraser className="h-3.5 w-3.5" />
          Clear chat
        </button>
      }
    >
      <div className="max-w-4xl space-y-4">
        {lastError ? <div className="erp-alert-error">{lastError}</div> : null}

        <div
          ref={listRef}
          className="h-[420px] space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4"
        >
          {isEmptyThread ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Bot className="h-8 w-8 text-slate-400" />
              <div className="max-w-sm space-y-1">
                <p className="text-sm font-medium text-slate-800">Ask a grounded ERP question</p>
                <p className="text-xs leading-5 text-slate-500">
                  Try &quot;How many open leads?&quot; or &quot;Show unpaid invoices&quot;. Replies use live tenant
                  data only.
                </p>
              </div>
            </div>
          ) : (
            messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "copilot" ? <Bot className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" /> : null}
                <div
                  className={`max-w-md rounded-lg p-3 ${
                    m.sender === "user"
                      ? "bg-slate-900 text-white"
                      : m.isError
                        ? "border border-rose-200 bg-rose-50 text-rose-800"
                        : "bg-slate-100 text-slate-800"
                  }`}
                >
                  <p>{m.text}</p>
                  {m.citations && m.citations.length > 0 ? (
                    <p className="mt-2 text-[10px] opacity-70">Citations: {m.citations.length} tool result(s)</p>
                  ) : null}
                </div>
              </div>
            ))
          )}
          {sending ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Bot className="h-4 w-4 animate-pulse" />
              Thinking…
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder='Try: "How many open leads?" or "Show unpaid invoices"'
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            className="h-10 text-xs"
            disabled={sending}
          />
          <button type="submit" disabled={sending || !inputPrompt.trim()} className={erpButtonClassName.primary}>
            <Send className="h-4 w-4" />
            {sending ? "Thinking…" : "Send"}
          </button>
        </form>
      </div>
    </StandardPageLayout>
  );
}
