"use client";

import * as React from "react";
import {
  Save,
  Send,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Clock,
  FileText,
  History,
  Paperclip,
  MoreVertical,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type RecordStatus =
  | "draft"
  | "submitted"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "completed"
  | "archived";

export type RecordFormTab = {
  id: string;
  label: string;
  badge?: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
};

export type ErpRecordFormProps = {
  /** Title of the record (e.g., "Employee Record: EMP-0091") */
  title: string;
  /** Subtitle or record code */
  code?: string;
  /** Back button handler */
  onBack?: () => void;
  /** Current record workflow status */
  status?: RecordStatus;
  /** Save action handler */
  onSave?: () => void;
  /** Is saving loading state */
  isSaving?: boolean;
  /** Submit for approval handler */
  onSubmitWorkflow?: () => void;
  /** Approve record handler */
  onApprove?: () => void;
  /** Reject record handler */
  onReject?: () => void;
  /** Form tabs list */
  tabs: RecordFormTab[];
  /** Default selected tab ID */
  defaultTabId?: string;
  /** Summary KPI / Field badges placed below title header */
  summaryCards?: React.ReactNode;
  /** Custom extra action buttons */
  extraActions?: React.ReactNode;
};

const statusConfig: Record<
  RecordStatus,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  draft: {
    label: "Draft",
    bg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-200 dark:border-slate-700",
    text: "text-slate-700 dark:text-slate-300",
    dot: "bg-slate-500",
  },
  submitted: {
    label: "Submitted",
    bg: "bg-blue-50 dark:bg-blue-950/60",
    border: "border-blue-200 dark:border-blue-900/60",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-600",
  },
  pending_approval: {
    label: "Pending Approval",
    bg: "bg-amber-50 dark:bg-amber-950/60",
    border: "border-amber-200 dark:border-amber-900/60",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500 animate-pulse",
  },
  approved: {
    label: "Approved",
    bg: "bg-emerald-50 dark:bg-emerald-950/60",
    border: "border-emerald-200 dark:border-emerald-900/60",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-600",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-rose-50 dark:bg-rose-950/60",
    border: "border-rose-200 dark:border-rose-900/60",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-600",
  },
  completed: {
    label: "Completed",
    bg: "bg-indigo-50 dark:bg-indigo-950/60",
    border: "border-indigo-200 dark:border-indigo-900/60",
    text: "text-indigo-700 dark:text-indigo-300",
    dot: "bg-indigo-600",
  },
  archived: {
    label: "Archived",
    bg: "bg-slate-200/80 dark:bg-slate-800/80",
    border: "border-slate-300 dark:border-slate-700",
    text: "text-slate-600 dark:text-slate-400",
    dot: "bg-slate-400",
  },
};

export function ErpRecordForm({
  title,
  code,
  onBack,
  status = "draft",
  onSave,
  isSaving = false,
  onSubmitWorkflow,
  onApprove,
  onReject,
  tabs,
  defaultTabId,
  summaryCards,
  extraActions,
}: ErpRecordFormProps) {
  const [activeTabId, setActiveTabId] = React.useState<string>(
    defaultTabId || tabs[0]?.id || ""
  );

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const currentStatus = statusConfig[status] || statusConfig.draft;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ── Record Header Panel ───────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Back button & Record Title */}
          <div className="flex items-center gap-3 min-w-0">
            {onBack && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="h-8 w-8 p-0 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300"
                title="Back to record list"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                  {title}
                </h1>

                {code && (
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-mono font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                    {code}
                  </span>
                )}

                {/* Workflow Status Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${currentStatus.bg} ${currentStatus.border} ${currentStatus.text}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${currentStatus.dot}`} />
                  <span>{currentStatus.label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {onSave && (
              <Button
                onClick={onSave}
                disabled={isSaving}
                size="sm"
                className="h-8.5 gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{isSaving ? "Saving..." : "Save"}</span>
              </Button>
            )}

            {onSubmitWorkflow && status === "draft" && (
              <Button
                onClick={onSubmitWorkflow}
                size="sm"
                className="h-8.5 gap-1.5 rounded-lg bg-amber-600 px-3.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Submit</span>
              </Button>
            )}

            {onApprove && (status === "submitted" || status === "pending_approval") && (
              <Button
                onClick={onApprove}
                size="sm"
                className="h-8.5 gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Approve</span>
              </Button>
            )}

            {onReject && (status === "submitted" || status === "pending_approval") && (
              <Button
                onClick={onReject}
                variant="outline"
                size="sm"
                className="h-8.5 gap-1.5 rounded-lg border-rose-200 bg-rose-50 px-3.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-300"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Reject</span>
              </Button>
            )}

            {extraActions}
          </div>
        </div>

        {/* Optional KPI Summary Cards */}
        {summaryCards && (
          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
            {summaryCards}
          </div>
        )}
      </div>

      {/* ── Record Tabs Navigation ────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-1 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-1 overflow-x-auto p-1 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? "bg-slate-100 text-blue-700 shadow-2xs dark:bg-slate-800 dark:text-blue-400"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-950 dark:hover:text-slate-100"
                }`}
              >
                {Icon && <Icon className={`h-3.5 w-3.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Record Tab Content Body ───────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 min-h-[300px]">
        {activeTab?.content}
      </div>
    </div>
  );
}
