"use client";

import * as React from "react";
import {
  Clock,
  User,
  CheckCircle2,
  FileEdit,
  ShieldAlert,
  Send,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type ActivityItem = {
  id: string;
  actor: string;
  action: string;
  details?: string;
  timestamp: string;
  type?: "system" | "user" | "approval" | "comment";
};

export function ActivityTimelineWidget({
  items,
  onAddComment,
}: {
  items: ActivityItem[];
  onAddComment?: (comment: string) => void;
}) {
  const [commentText, setCommentText] = React.useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !onAddComment) return;
    onAddComment(commentText.trim());
    setCommentText("");
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Add comment box */}
      {onAddComment && (
        <form onSubmit={handleSend} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add an internal note or comment..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={!commentText.trim()}
            className="h-9 gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Post</span>
          </Button>
        </form>
      )}

      {/* Timeline Feed */}
      <div className="relative space-y-4 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
        {items.map((item) => {
          let Icon = Clock;
          let iconBg = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";

          if (item.type === "approval") {
            Icon = CheckCircle2;
            iconBg = "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400";
          } else if (item.type === "comment") {
            Icon = MessageSquare;
            iconBg = "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-400";
          } else if (item.type === "user") {
            Icon = User;
            iconBg = "bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400";
          }

          return (
            <div key={item.id} className="relative flex items-start gap-3 pl-8">
              <div
                className={`absolute left-0 top-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${iconBg}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>

              <div className="flex-1 rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-xs dark:border-slate-800/80 dark:bg-slate-950/50">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {item.actor}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">
                    {item.timestamp}
                  </span>
                </div>
                <p className="mt-1 font-semibold text-slate-700 dark:text-slate-300">
                  {item.action}
                </p>
                {item.details && (
                  <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                    {item.details}
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
