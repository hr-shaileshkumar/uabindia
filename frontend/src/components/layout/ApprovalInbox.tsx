"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Loader2,
  ExternalLink,
  ShoppingCart,
  Users,
  CreditCard,
  FileText,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { appApi } from "@/services/modules";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

type ApprovalItem = {
  id: string;
  moduleKey?: string;
  entityType?: string;
  entityId?: string;
  currentStep?: number;
  totalSteps?: number;
  status?: string;
  requestedBy?: string;
  requesterName?: string;
  requestedAt?: string;
  comments?: string;
  amount?: number;
  department?: string;
  urgency?: "Normal" | "High" | "Urgent";
  title?: string;
};

export function ApprovalInbox() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await appApi.approvals.list("Pending");
      if (Array.isArray(res.data)) {
        setApprovals(res.data as ApprovalItem[]);
      }
    } catch {
      // Gracefully handle unauthenticated or non-approver roles
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchApprovals();
    const interval = setInterval(() => {
      void fetchApprovals();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      setActingId(id);
      if (action === "approve") {
        await appApi.approvals.approve(id, { comments: "Approved via One-Inbox" });
      } else {
        await appApi.approvals.reject(id, { comments: "Rejected via One-Inbox" });
      }
      setApprovals((prev) => prev.filter((item) => item.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Action failed";
      alert(`Approval action failed: ${msg}`);
    } finally {
      setActingId(null);
    }
  };

  const getEntityIcon = (type?: string) => {
    switch ((type || "").toLowerCase()) {
      case "purchaseorder":
        return <ShoppingCart className="h-4 w-4 text-blue-600" />;
      case "leaveapplication":
      case "leave":
        return <Users className="h-4 w-4 text-purple-600" />;
      case "expenseclaim":
      case "expense":
        return <CreditCard className="h-4 w-4 text-emerald-600" />;
      default:
        return <FileText className="h-4 w-4 text-slate-600" />;
    }
  };

  const pendingCount = approvals.length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) void fetchApprovals();
        }}
        title="Approvals Inbox"
        aria-label="Approvals Inbox"
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          open
            ? "bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        )}
      >
        <FileCheck className="h-4 w-4" />
        {pendingCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white shadow-xs animate-in zoom-in-50 duration-200">
            {pendingCount > 99 ? "99+" : pendingCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">One-Inbox Approvals</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                  {pendingCount} Pending
                </span>
              </div>
              <Link
                href={ROUTES.APPROVALS}
                onClick={() => setOpen(false)}
                className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Full Queue <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {/* List */}
            <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800/60">
              {loading && approvals.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-xs text-slate-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-600" /> Loading approvals...
                </div>
              ) : approvals.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Inbox Zero!</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">No pending approval requests waiting for you.</p>
                </div>
              ) : (
                approvals.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 p-3.5 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                          {getEntityIcon(item.entityType)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {item.title || item.entityType || "Approval Request"}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            By {item.requesterName || item.requestedBy || "User"}
                            {item.department ? ` • ${item.department}` : ""}
                          </p>
                        </div>
                      </div>
                      {item.amount != null && item.amount > 0 && (
                        <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                          ₹{item.amount.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>

                    {item.comments && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-2 rounded-lg italic border border-slate-100 dark:border-slate-800/60">
                        "{item.comments}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {item.requestedAt || "Recently"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={actingId === item.id}
                          onClick={() => handleAction(item.id, "reject")}
                          className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                        <button
                          type="button"
                          disabled={actingId === item.id}
                          onClick={() => handleAction(item.id, "approve")}
                          className="flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-2xs transition-colors"
                        >
                          {actingId === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50/50 p-2.5 text-center dark:border-slate-800 dark:bg-slate-950/40">
              <Link
                href={ROUTES.APPROVALS}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
              >
                <ExternalLink className="h-3 w-3" /> View Governance Workflow Engine
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ApprovalInbox;
