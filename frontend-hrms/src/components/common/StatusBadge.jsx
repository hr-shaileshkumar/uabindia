import React from "react";

export const StatusBadge = ({ status, tone, size = "md" }) => {
  if (!status) return null;

  const normalized = String(status).toLowerCase().replace(/[\s\-_]/g, "");

  // Determine tone if not explicitly provided
  let badgeTone = tone;
  if (!badgeTone) {
    if (["active", "approved", "completed", "paid", "confirmed", "present", "hired", "settled", "verified", "issued"].includes(normalized)) {
      badgeTone = "positive";
    } else if (["pending", "onleave", "draft", "proposed", "onhold", "noticeperiod", "processing", "late", "screening"].includes(normalized)) {
      badgeTone = "warning";
    } else if (["terminated", "rejected", "absent", "discontinued", "inactive", "cancelled"].includes(normalized)) {
      badgeTone = "negative";
    } else if (["onboarding", "technicalinterview", "managerinterview", "published", "inreview", "clearanceinprogress"].includes(normalized)) {
      badgeTone = "info";
    } else {
      badgeTone = "neutral";
    }
  }

  const toneStyles = {
    positive: "bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-emerald-500/10",
    warning: "bg-amber-50 text-amber-700 border-amber-200/80 ring-amber-500/10",
    negative: "bg-rose-50 text-rose-700 border-rose-200/80 ring-rose-500/10",
    info: "bg-sky-50 text-sky-700 border-sky-200/80 ring-sky-500/10",
    neutral: "bg-slate-100 text-slate-700 border-slate-200/80 ring-slate-500/10",
  };

  const dotStyles = {
    positive: "bg-emerald-500",
    warning: "bg-amber-500",
    negative: "bg-rose-500",
    info: "bg-sky-500",
    neutral: "bg-slate-400",
  };

  const sizeClasses = size === "sm" ? "px-1.5 py-0.2 text-[10px]" : "px-2 py-0.5 text-[10.5px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-2xs ${sizeClasses} ${toneStyles[badgeTone] || toneStyles.neutral}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[badgeTone] || dotStyles.neutral}`} />
      <span>{status}</span>
    </span>
  );
};

export default StatusBadge;
