"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, ArrowRight, ShieldCheck, AlertCircle, Clock } from "lucide-react";
import type { DynamicWorkflowConfig, WorkflowTransition } from "@/lib/dynamic-schema/types";
import { cn } from "@/lib/utils";

interface DynamicRecordWorkflowBarProps {
  workflow: DynamicWorkflowConfig;
  currentState: string;
  onTransition: (transition: WorkflowTransition, remarks?: string) => Promise<void> | void;
  disabled?: boolean;
}

export function DynamicRecordWorkflowBar({
  workflow,
  currentState,
  onTransition,
  disabled = false,
}: DynamicRecordWorkflowBarProps) {
  const [selectedTransition, setSelectedTransition] = useState<WorkflowTransition | null>(null);
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!workflow || !workflow.enabled) return null;

  const validTransitions = workflow.transitions.filter(
    (t) => t.fromState.toLowerCase() === currentState.toLowerCase()
  );

  const handleConfirmTransition = async () => {
    if (!selectedTransition) return;
    try {
      setIsSubmitting(true);
      await onTransition(selectedTransition, remarks);
      setSelectedTransition(null);
      setRemarks("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60 p-3.5 space-y-3 transition-colors shadow-2xs">
      {/* Workflow Progress Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {workflow.states.map((st, idx) => {
            const isCurrent = st.name.toLowerCase() === currentState.toLowerCase();
            const isCompleted =
              workflow.states.findIndex((s) => s.name.toLowerCase() === currentState.toLowerCase()) > idx;

            return (
              <React.Fragment key={st.name}>
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition-all",
                    isCurrent
                      ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-600/20"
                      : isCompleted
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-white text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : isCurrent ? (
                    <Clock className="h-3.5 w-3.5 text-white animate-pulse" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  )}
                  <span>{st.label}</span>
                </div>
                {idx < workflow.states.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Transition Action Buttons */}
        {validTransitions.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {validTransitions.map((tr) => (
              <button
                key={tr.action || (tr as any).actionLabel || tr.toState}
                type="button"
                disabled={disabled}
                onClick={() => setSelectedTransition(tr)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50",
                  tr.variant === "success"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : tr.variant === "danger"
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : tr.variant === "warning"
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                )}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{tr.label || (tr as any).actionLabel || tr.action}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation / Remarks Modal */}
      {selectedTransition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Confirm Action: {selectedTransition.label}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Transitioning record status to{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedTransition.toState}
                </span>
                .
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Remarks / Comments {selectedTransition.requiresRemarks && <span className="text-rose-500">*</span>}
              </label>
              <textarea
                id="workflow-transition-remarks"
                name="workflow_transition_remarks"
                rows={3}
                value={remarks}
                placeholder="Add audit notes or reasoning…"
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedTransition(null);
                  setRemarks("");
                }}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTransition}
                disabled={isSubmitting || (selectedTransition.requiresRemarks && !remarks.trim())}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Processing…" : "Confirm & Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
