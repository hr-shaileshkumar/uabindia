"use client";

import { type ReactNode } from "react";
import { CheckCircle2, Clock, FileText, Send, User, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineEvent = {
  id: string;
  title: string;
  timestamp: string;
  actor?: string;
  type?: "create" | "update" | "approve" | "reject" | "send" | "status" | "note";
  description?: ReactNode;
  metadata?: Record<string, string | number>;
};

const iconMap = {
  create: FileText,
  update: RefreshCw,
  approve: CheckCircle2,
  reject: AlertCircle,
  send: Send,
  status: Clock,
  note: User,
};

const toneMap = {
  create: "bg-blue-50 text-blue-600 border-blue-200",
  update: "bg-slate-50 text-slate-600 border-slate-200",
  approve: "bg-emerald-50 text-emerald-600 border-emerald-200",
  reject: "bg-rose-50 text-rose-600 border-rose-200",
  send: "bg-indigo-50 text-indigo-600 border-indigo-200",
  status: "bg-amber-50 text-amber-600 border-amber-200",
  note: "bg-purple-50 text-purple-600 border-purple-200",
};

export function ErpAuditTimeline({
  events = [],
  emptyMessage = "No activity recorded yet.",
}: {
  events: TimelineEvent[];
  emptyMessage?: string;
}) {
  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        <Clock className="mx-auto h-6 w-6 text-slate-300 mb-1.5" />
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {events.map((event) => {
        const type = event.type ?? "note";
        const Icon = iconMap[type] || Clock;
        const toneCls = toneMap[type] || toneMap.note;

        return (
          <div key={event.id} className="relative group">
            {/* Timeline Dot Icon */}
            <div
              className={cn(
                "absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full border bg-white shadow-2xs",
                toneCls
              )}
            >
              <Icon className="h-2.5 w-2.5" />
            </div>

            {/* Event Body */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xs font-semibold text-slate-900">{event.title}</p>
                <span className="text-[10px] font-medium text-slate-400 tabular-nums">
                  {event.timestamp}
                </span>
              </div>

              {event.actor && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  by <span className="font-medium text-slate-700">{event.actor}</span>
                </p>
              )}

              {event.description && (
                <div className="mt-1 text-xs text-slate-600 leading-relaxed rounded-md bg-slate-50 border border-slate-100 p-2">
                  {event.description}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
