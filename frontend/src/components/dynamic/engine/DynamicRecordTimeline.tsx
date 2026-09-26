"use client";

import React, { useState } from "react";
import { MessageSquare, Clock, Send, ShieldCheck, User, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimelineEntry {
  id: string;
  type: "comment" | "status_change" | "system_audit" | "creation";
  author: string;
  avatar?: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface DynamicRecordTimelineProps {
  entries?: TimelineEntry[];
  onAddComment?: (comment: string) => Promise<void> | void;
  recordTitle?: string;
}

export function DynamicRecordTimeline({
  entries = [],
  onAddComment,
  recordTitle,
}: DynamicRecordTimelineProps) {
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handlePostComment = async () => {
    if (!comment.trim() || !onAddComment) return;
    try {
      setSubmitting(true);
      await onAddComment(comment.trim());
      setComment("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>Activity Stream & Audit History</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time record events, stage changes, and internal collaboration notes.
        </p>
      </div>

      {/* New Note / Comment Input */}
      {onAddComment && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 p-3 space-y-2.5 shadow-2xs">
          <textarea
            id="timeline-comment-input"
            name="timeline_comment"
            rows={2}
            value={comment}
            placeholder={`Add a note or update on this ${recordTitle || "record"}…`}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Visible to team members with access</span>
            <button
              type="button"
              onClick={handlePostComment}
              disabled={submitting || !comment.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Send className="h-3 w-3" />
              <span>{submitting ? "Posting…" : "Post Note"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Chronological Timeline List */}
      <div className="space-y-4 pt-2">
        {entries.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            <Clock className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2 stroke-1" />
            <p>No activity recorded yet for this record.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-4 space-y-6">
            {entries.map((item) => (
              <div key={item.id} className="relative group">
                {/* Node Icon on the line */}
                <div className="absolute -left-6.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-2xs">
                  {item.type === "status_change" ? (
                    <ShieldCheck className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                  ) : item.type === "creation" ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <MessageSquare className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                  )}
                </div>

                <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-850 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                        {item.author?.[0]?.toUpperCase() || <User className="h-2.5 w-2.5" />}
                      </span>
                      <span>{item.author}</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[10px]">{item.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {item.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
