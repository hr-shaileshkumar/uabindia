"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { SideDrawer } from "@/components/ui/side-drawer";
import { erpButtonClassName, erpFormInputClassName, erpFormLabelClassName } from "@/components/workspace/styles";
import { aiApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError } from "@/lib/notifications";

type RecordAiDrawerProps = {
  open: boolean;
  onClose: () => void;
  recordType: "employee" | "payrollrun" | "invoice";
  recordId: string;
  title?: string;
  subtitle?: string;
  suggestedPrompt?: string;
};

export function RecordAiDrawer({
  open,
  onClose,
  recordType,
  recordId,
  title = "Ask AI about this record",
  subtitle,
  suggestedPrompt,
}: RecordAiDrawerProps) {
  const [prompt, setPrompt] = useState(suggestedPrompt ?? "Summarize this record and flag anything I should review.");
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!prompt.trim() || !recordId) return;
    try {
      setLoading(true);
      setReply(null);
      const res = await aiApi.chat({
        message: prompt.trim(),
        recordType,
        recordId,
      });
      const raw = res.data;
      const text =
        raw?.data?.reply ??
        raw?.reply ??
        (typeof raw === "string" ? raw : null) ??
        "No reply returned.";
      setReply(String(text));
    } catch (err) {
      notifyError(getApiErrorMessage(err, "AI chat failed."), "AI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle ?? `Grounded context for ${recordType} · ${recordId.slice(0, 8)}…`}
      width="md"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={erpButtonClassName.secondary}>
            Close
          </button>
          <button
            type="button"
            onClick={() => void ask()}
            className={`${erpButtonClassName.primary} gap-1.5`}
            disabled={loading || !prompt.trim()}
          >
            <Sparkles className="h-4 w-4" />
            {loading ? "Thinking…" : "Ask"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="ai-prompt" className={erpFormLabelClassName}>
            Prompt
          </label>
          <textarea
            id="ai-prompt"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className={`${erpFormInputClassName} mt-1`}
            placeholder="Ask a question about this record…"
          />
        </div>
        {reply ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 whitespace-pre-wrap">
            {reply}
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Replies use tenant-scoped tools with this record as context (no external LLM required).
          </p>
        )}
      </div>
    </SideDrawer>
  );
}
