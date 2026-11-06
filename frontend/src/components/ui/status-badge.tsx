import * as React from "react";
import { cn } from "@/lib/utils";

export type ERPStatusType =
  | "active"
  | "approved"
  | "completed"
  | "success"
  | "pending"
  | "in_progress"
  | "warning"
  | "failed"
  | "rejected"
  | "error"
  | "danger"
  | "draft"
  | "cancelled"
  | "neutral"
  | string;

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: ERPStatusType;
  label?: string;
  showDot?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function getStatusTheme(status: string) {
  const norm = status.toLowerCase().replace(/[\s_-]+/g, "");
  if (["active", "approved", "completed", "success", "paid", "healthy", "resolved"].includes(norm)) {
    return {
      bg: "bg-[var(--success-bg)]",
      text: "text-[var(--success)]",
      border: "border-[var(--success)]/20",
      dot: "bg-[var(--success)]",
      defaultLabel: status || "Active",
    };
  }
  if (["pending", "in_progress", "inprogress", "warning", "late", "scheduled", "hold", "review"].includes(norm)) {
    return {
      bg: "bg-[var(--warning-bg)]",
      text: "text-[var(--warning)]",
      border: "border-[var(--warning)]/20",
      dot: "bg-[var(--warning)]",
      defaultLabel: status || "Pending",
    };
  }
  if (["failed", "rejected", "error", "danger", "critical", "cancelled", "canceled", "unpaid", "overdue"].includes(norm)) {
    return {
      bg: "bg-[var(--danger-bg)]",
      text: "text-[var(--danger)]",
      border: "border-[var(--danger)]/20",
      dot: "bg-[var(--danger)]",
      defaultLabel: status || "Failed",
    };
  }
  if (["info", "processing", "sent", "open"].includes(norm)) {
    return {
      bg: "bg-[var(--info-bg)]",
      text: "text-[var(--info)]",
      border: "border-[var(--info)]/20",
      dot: "bg-[var(--info)]",
      defaultLabel: status || "Info",
    };
  }
  // Draft / neutral
  return {
    bg: "bg-[var(--bg-muted)]",
    text: "text-[var(--text-muted)]",
    border: "border-[var(--border-subtle)]",
    dot: "bg-[var(--text-muted)]",
    defaultLabel: status || "Draft",
  };
}

export function StatusBadge({
  status,
  label,
  showDot = true,
  size = "md",
  className = "",
  ...props
}: StatusBadgeProps) {
  const theme = getStatusTheme(status);
  const displayText = label || theme.defaultLabel;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-3xs font-medium gap-1",
    md: "px-2.5 py-0.5 text-2xs font-semibold gap-1.5",
    lg: "px-3 py-1 text-xs font-semibold gap-2",
  };

  const dotSizeClasses = {
    sm: "h-1 w-1",
    md: "h-1.5 w-1.5",
    lg: "h-2 w-2",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full border transition-colors select-none capitalize",
        theme.bg,
        theme.text,
        theme.border,
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {showDot && <span className={cn("rounded-full shrink-0 animate-pulse", theme.dot, dotSizeClasses[size])} />}
      <span>{displayText}</span>
    </div>
  );
}
