"use client";

import React from "react";
import {
  FileText,
  FileCheck,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Receipt,
  ArrowRight,
  ShieldCheck,
  Check,
  Clock,
  AlertTriangle,
} from "lucide-react";

export type DocumentLifecycleStage = {
  key: "PR" | "RFQ" | "PO" | "GRN" | "MATCH" | "BILL" | "PAYMENT";
  label: string;
  docNumber?: string;
  status: "completed" | "current" | "pending" | "skipped";
  date?: string;
  amount?: number;
  notes?: string;
};

interface DocumentLifecycleTimelineProps {
  currentStage: "PR" | "RFQ" | "PO" | "GRN" | "MATCH" | "BILL" | "PAYMENT";
  stages?: Partial<Record<DocumentLifecycleStage["key"], Partial<DocumentLifecycleStage>>>;
  onAction?: (actionKey: string) => void;
}

const DEFAULT_STAGES: DocumentLifecycleStage[] = [
  { key: "PR", label: "Requisition", status: "completed", docNumber: "PR-2026-081" },
  { key: "RFQ", label: "Vendor RFQ", status: "completed", docNumber: "RFQ-2026-034" },
  { key: "PO", label: "Purchase Order", status: "current", docNumber: "PO-2026-0142" },
  { key: "GRN", label: "Goods Receipt (GRN)", status: "pending", docNumber: "Pending Delivery" },
  { key: "MATCH", label: "3-Way Match Audit", status: "pending", notes: "PO vs GRN vs Bill" },
  { key: "BILL", label: "Vendor Bill & Ledger", status: "pending", docNumber: "Pending Invoice" },
  { key: "PAYMENT", label: "Payment Settlement", status: "pending", docNumber: "Pending Payout" },
];

export function DocumentLifecycleTimeline({
  currentStage,
  stages = {},
  onAction,
}: DocumentLifecycleTimelineProps) {
  const mergedStages = DEFAULT_STAGES.map((defaultStage) => {
    const override = stages[defaultStage.key] || {};
    let status: DocumentLifecycleStage["status"] = "pending";

    const stageOrder = ["PR", "RFQ", "PO", "GRN", "MATCH", "BILL", "PAYMENT"];
    const currentIndex = stageOrder.indexOf(currentStage);
    const stageIndex = stageOrder.indexOf(defaultStage.key);

    if (stageIndex < currentIndex) status = "completed";
    else if (stageIndex === currentIndex) status = "current";
    else status = "pending";

    return {
      ...defaultStage,
      ...override,
      status: override.status ?? status,
    };
  });

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            SCM Document Lifecycle Audit Trail (PR ➔ PO ➔ GRN ➔ 3-Way Match ➔ Bill)
          </h4>
        </div>
        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          Governed Workflow
        </span>
      </div>

      {/* Horizontal Step Sequence */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {mergedStages.map((stage, idx) => {
          const isCompleted = stage.status === "completed";
          const isCurrent = stage.status === "current";

          return (
            <div
              key={stage.key}
              className={`relative flex flex-col justify-between rounded-xl border p-3 transition-all ${
                isCurrent
                  ? "border-indigo-500 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-500/30 dark:bg-indigo-950/20"
                  : isCompleted
                  ? "border-emerald-200 bg-emerald-50/20 dark:border-emerald-950 dark:bg-emerald-950/10"
                  : "border-slate-100 bg-slate-50/50 opacity-60 dark:border-slate-800 dark:bg-slate-800/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {isCompleted ? <Check className="h-3 w-3" /> : idx + 1}
                </span>

                <span
                  className={`text-[10px] font-bold uppercase ${
                    isCompleted
                      ? "text-emerald-700 dark:text-emerald-400"
                      : isCurrent
                      ? "text-indigo-700 dark:text-indigo-400"
                      : "text-slate-400"
                  }`}
                >
                  {isCompleted ? "Done" : isCurrent ? "Active" : "Queue"}
                </span>
              </div>

              <div className="mt-2.5 space-y-0.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {stage.label}
                </p>
                <p className="font-mono text-[10px] text-slate-500 truncate">
                  {stage.docNumber ?? "—"}
                </p>
              </div>

              {stage.amount && (
                <p className="mt-2 font-mono text-[11px] font-extrabold text-slate-900 dark:text-slate-200">
                  ₹{stage.amount.toLocaleString("en-IN")}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
