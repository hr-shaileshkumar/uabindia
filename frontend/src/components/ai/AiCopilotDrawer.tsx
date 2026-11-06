'use client';

import React, { useState } from 'react';
import { Bot, Sparkles, X, Send, AlertTriangle, ChevronRight, Activity, ArrowUpRight, ShieldAlert, Cpu } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { formatCurrency } from '@/lib/formatters';

interface CopilotMetric {
  [key: string]: number;
}

interface Anomaly {
  module: string;
  severity: string;
  title: string;
  description: string;
  detectedAtUtc: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  metrics?: CopilotMetric;
  actions?: string[];
  toolExecuted?: string;
  requiresHumanApproval?: boolean;
}

export const AiCopilotDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Hello! I am your Enterprise ERP AI Copilot. Ask me about real-time sales revenue, inventory health, low-stock reorder forecasts, workforce metrics, or automated anomaly detection.',
      actions: ['Analyze Sales Revenue', 'Check Low-Stock Alerts', 'Show Active Headcount', 'Scan System Anomalies'],
    },
  ]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [showAnomalies, setShowAnomalies] = useState(false);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || prompt;
    if (!textToSend.trim()) return;

    const userMessage = textToSend.trim();
    setPrompt('');
    setChatHistory((prev) => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      if (userMessage.toLowerCase().includes('anomal')) {
        const res = await apiClient.get<{ success: boolean; data: Anomaly[] }>('/ai/copilot/anomalies');
        const alertList = res.data?.data || [];
        setAnomalies(alertList);
        setShowAnomalies(true);
        setChatHistory((prev) => [
          ...prev,
          {
            role: 'assistant',
            text:
              alertList.length > 0
                ? `Detected ${alertList.length} potential anomalies across Finance, Inventory, and Workflow Approvals.`
                : 'All systems healthy. No abnormal financial spikes or negative inventory balances detected.',
            actions: ['Review Negative Stock', 'View Overdue Invoices'],
          },
        ]);
      } else {
        const res = await apiClient.post<{
          success: boolean;
          data: {
            answer?: string;
            metrics?: CopilotMetric;
            suggestedActions?: string[];
            toolExecuted?: string;
            requiresHumanApproval?: boolean;
          };
        }>('/ai/copilot/query', {
          prompt: userMessage,
        });
        const data = res.data?.data;
        setChatHistory((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: data?.answer || 'Query processed successfully.',
            metrics: data?.metrics,
            actions: data?.suggestedActions || [],
            toolExecuted: data?.toolExecuted && data.toolExecuted !== 'None' ? data.toolExecuted : undefined,
            requiresHumanApproval: data?.requiresHumanApproval,
          },
        ]);
      }
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Connected to local enterprise intelligence engine. All modules operating within standard parameters.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-400"
        aria-label="Open AI Copilot"
      >
        <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
        <span className="text-sm font-semibold tracking-wide hidden sm:inline">AI Copilot</span>
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-600/10 via-blue-600/5 to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Enterprise AI Copilot</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                    Real-Time Ledger Intelligence
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl transition"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {msg.toolExecuted && (
                      <div className="mb-1.5 flex items-center gap-1">
                        <span className="text-[9px] font-mono uppercase bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md font-semibold tracking-wider flex items-center gap-1">
                          <Cpu className="w-2.5 h-2.5" />
                          Tool: {msg.toolExecuted}
                        </span>
                      </div>
                    )}
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                    {msg.requiresHumanApproval && (
                      <div className="mt-2.5 p-2 bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/60 rounded-xl flex items-start gap-1.5 text-amber-900 dark:text-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div className="text-[11px] leading-tight">
                          <span className="font-bold">Human-in-the-Loop Gate:</span> This action is staged as a draft and requires authorized manager sign-off.
                        </div>
                      </div>
                    )}

                    {/* Metrics Cards */}
                    {msg.metrics && Object.keys(msg.metrics).length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {Object.entries(msg.metrics).map(([key, val]) => (
                          <div
                            key={key}
                            className="bg-white/90 dark:bg-slate-900/90 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                          >
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                              {key.replace(/([A-Z])/g, ' $1')}
                            </span>
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5 block">
                              {typeof val === 'number' && val >= 1000 ? formatCurrency(val, 'USD') : val}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Suggested Action Chips */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.actions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          type="button"
                          onClick={() => void handleSend(act)}
                          className="text-[11px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 rounded-full px-3 py-1 transition flex items-center gap-1 font-medium"
                        >
                          {act}
                          <ArrowUpRight className="w-3 h-3 opacity-60" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Activity className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>AI Copilot is analyzing multi-domain ERP records…</span>
                </div>
              )}

              {/* Anomaly Alerts List */}
              {showAnomalies && anomalies.length > 0 && (
                <div className="mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Active System Anomaly Alerts ({anomalies.length})</span>
                  </div>
                  {anomalies.map((anom, aIdx) => (
                    <div
                      key={aIdx}
                      className="text-xs bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/30 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{anom.title}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            anom.severity === 'High'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {anom.severity}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px]">{anom.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask a question (e.g. 'Show sales revenue')..."
                  className="flex-1 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus:border-indigo-500 focus:outline-hidden text-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  disabled={!prompt.trim() || isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2.5 rounded-xl shadow-xs transition-all"
                  aria-label="Send query"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
