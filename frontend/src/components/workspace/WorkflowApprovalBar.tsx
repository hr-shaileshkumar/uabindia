"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, Clock, AlertTriangle, ArrowRight, ShieldCheck, UserCheck, MessageSquare, Send } from "lucide-react";
import apiClient from "@/services/apiClient";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { formatDateTime } from "@/lib/formatters";

export interface WorkflowApprovalBarProps {
  instanceId?: string;
  moduleKey: string;
  entityType: string;
  entityId: string;
  currentStep?: number;
  totalSteps?: number;
  status: "Pending" | "Approved" | "Rejected" | "Draft" | string;
  canApprove?: boolean;
  onActionComplete?: () => void;
}

export function WorkflowApprovalBar({
  instanceId,
  moduleKey,
  entityType,
  entityId,
  currentStep = 1,
  totalSteps = 2,
  status,
  canApprove = true,
  onActionComplete,
}: WorkflowApprovalBarProps) {
  const [loading, setLoading] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");

  const handleAction = async (actionType: "approve" | "reject") => {
    setPendingAction(actionType);
    setCommentModalOpen(true);
  };

  const submitAction = async () => {
    if (!pendingAction) return;

    try {
      setLoading(true);
      if (instanceId) {
        await apiClient.post(`/workflow/instances/${instanceId}/actions`, {
          actionType: pendingAction,
          comment: comment.trim() || undefined,
        });
      } else {
        // Fallback generic approval endpoint
        await apiClient.post(`/api/v1/workflow/approvals`, {
          moduleKey,
          entityType,
          entityId,
          action: pendingAction,
          comment: comment.trim() || undefined,
        });
      }

      notifySuccess(
        `Document has been ${pendingAction === "approve" ? "approved" : "rejected"} successfully.`,
        "Workflow Engine"
      );
      setCommentModalOpen(false);
      setComment("");
      onActionComplete?.();
    } catch (err: unknown) {
      notifyError("Failed to record workflow action.", "Workflow Engine");
    } finally {
      setLoading(false);
    }
  };

  const isPending = status.toLowerCase() === "pending";
  const isApproved = status.toLowerCase() === "approved" || status.toLowerCase() === "completed";
  const isRejected = status.toLowerCase() === "rejected";

  return (
    <>
      <div
        className={`rounded-2xl border p-4 transition shadow-xs ${
          isApproved
            ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
            : isRejected
            ? "border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20"
            : "border-indigo-100 bg-indigo-50/40 dark:border-indigo-900/40 dark:bg-indigo-950/20"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${
                isApproved
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                  : isRejected
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300"
                  : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
              }`}
            >
              {isApproved ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : isRejected ? (
                <XCircle className="h-5 w-5" />
              ) : (
                <Clock className="h-5 w-5 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Workflow Authorization
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold uppercase ${
                    isApproved
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200"
                      : isRejected
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-900/80 dark:text-rose-200"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200"
                  }`}
                >
                  {status}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
                {isApproved
                  ? "Document is fully authorized and locked for execution."
                  : isRejected
                  ? "Document authorization was rejected."
                  : `Awaiting Step ${currentStep} of ${totalSteps} sign-off.`}
              </p>
            </div>
          </div>

          {isPending && canApprove && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleAction("reject")}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-bold text-rose-700 shadow-2xs hover:bg-rose-50 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300 transition"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
              <button
                type="button"
                onClick={() => void handleAction("approve")}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve Step {currentStep}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Decision / Comment Modal */}
      {commentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  pendingAction === "approve"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                }`}
              >
                {pendingAction === "approve" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Confirm {pendingAction === "approve" ? "Approval" : "Rejection"}
                </h3>
                <p className="text-xs text-slate-500">
                  {pendingAction === "approve"
                    ? "Authorize this business document and advance the workflow."
                    : "Reject this document request with a reason."}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Decision Comments / Notes {pendingAction === "reject" && <span className="text-rose-500">*</span>}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  pendingAction === "approve"
                    ? "Optional notes (e.g. 'Budget verified, proceed.')"
                    : "Required reason for rejection..."
                }
                rows={3}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCommentModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitAction()}
                disabled={loading || (pendingAction === "reject" && !comment.trim())}
                className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition disabled:opacity-50 ${
                  pendingAction === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                {loading ? "Recording…" : `Confirm ${pendingAction === "approve" ? "Approval" : "Rejection"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
