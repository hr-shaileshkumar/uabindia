"use client";

import React from "react";
import { CheckCircle2, Clock, Lock, User, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorkflowStepItem {
  stepNumber: number;
  title: string;
  role: string;
  status: "completed" | "current" | "upcoming" | "rejected";
  approverName?: string;
  actionDate?: string;
  comments?: string;
}

interface ApprovalTimelineProps {
  currentStep?: number;
  totalSteps?: number;
  status?: string;
  requestedBy?: string;
  requestedAt?: string;
  comments?: string;
  steps?: WorkflowStepItem[];
  className?: string;
}

export function ApprovalTimeline({
  currentStep = 1,
  totalSteps = 3,
  status = "Pending",
  requestedBy,
  requestedAt,
  comments,
  steps,
  className,
}: ApprovalTimelineProps) {
  // Synthesize default approval steps if not provided explicitly
  const effectiveSteps: WorkflowStepItem[] = React.useMemo(() => {
    if (steps && steps.length > 0) return steps;

    const defaultRoleSteps = [
      { title: "Direct Reporting Manager", role: "Manager" },
      { title: "Department Head / HOD", role: "DepartmentHead" },
      { title: "Finance Controller / Executive", role: "FinanceAdmin" },
    ];

    const result: WorkflowStepItem[] = [
      {
        stepNumber: 0,
        title: "Request Initiated",
        role: "Requester",
        status: "completed",
        approverName: requestedBy || "Employee",
        actionDate: requestedAt,
        comments: comments || "Submitted for multi-tier authorization",
      },
    ];

    const isRejected = status.toLowerCase() === "rejected";
    const isApproved = status.toLowerCase() === "approved";

    for (let i = 1; i <= Math.max(totalSteps, 2); i++) {
      const def = defaultRoleSteps[i - 1] || { title: `Tier ${i} Authorization`, role: "AuthorizedApprover" };
      let stepStatus: WorkflowStepItem["status"] = "upcoming";

      if (isApproved) {
        stepStatus = "completed";
      } else if (isRejected) {
        stepStatus = i === currentStep ? "rejected" : i < currentStep ? "completed" : "upcoming";
      } else {
        if (i < currentStep) stepStatus = "completed";
        else if (i === currentStep) stepStatus = "current";
        else stepStatus = "upcoming";
      }

      result.push({
        stepNumber: i,
        title: def.title,
        role: def.role,
        status: stepStatus,
        approverName: stepStatus === "completed" ? "Authorized Officer" : undefined,
        actionDate: stepStatus === "completed" ? requestedAt : undefined,
      });
    }

    return result;
  }, [steps, currentStep, totalSteps, status, requestedBy, requestedAt, comments]);

  return (
    <div className={cn("space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40", className)}>
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Multi-Tier Approval Timeline</h4>
        </div>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
          Step {Math.min(currentStep, totalSteps)} of {totalSteps}
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {effectiveSteps.map((s, idx) => {
          const isCompleted = s.status === "completed";
          const isCurrent = s.status === "current";
          const isRejected = s.status === "rejected";

          return (
            <div key={idx} className="relative group">
              {/* Stepper Node Icon */}
              <div
                className={cn(
                  "absolute -left-[27px] top-0 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-xs transition-transform",
                  isCompleted && "bg-emerald-500",
                  isCurrent && "bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/60 animate-pulse",
                  isRejected && "bg-rose-500 ring-4 ring-rose-100 dark:ring-rose-900/60",
                  s.status === "upcoming" && "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : isCurrent ? (
                  <Clock className="h-3.5 w-3.5 text-white" />
                ) : isRejected ? (
                  <AlertCircle className="h-3.5 w-3.5" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
              </div>

              {/* Step Information Card */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p
                    className={cn(
                      "text-xs font-bold",
                      isCurrent && "text-blue-700 dark:text-blue-400",
                      isCompleted && "text-slate-900 dark:text-slate-100",
                      isRejected && "text-rose-600 dark:text-rose-400",
                      s.status === "upcoming" && "text-slate-400 dark:text-slate-500"
                    )}
                  >
                    {s.title}
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                      isCompleted && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                      isCurrent && "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
                      isRejected && "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
                      s.status === "upcoming" && "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    )}
                  >
                    {isCompleted ? "Approved" : isCurrent ? "Awaiting Decision" : isRejected ? "Rejected" : "Pending Tier"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <User className="h-3 w-3" /> Role: {s.role}
                  </span>
                  {s.approverName && <span>• {s.approverName}</span>}
                  {s.actionDate && (
                    <span>• {new Date(s.actionDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  )}
                </div>

                {s.comments && (
                  <p className="mt-1 rounded-lg bg-white p-2 text-[11px] text-slate-600 border border-slate-200/60 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-300">
                    &ldquo;{s.comments}&rdquo;
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ApprovalTimeline;
