"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCcw, Settings2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WorkspaceStatusPanelProps = {
  title: string;
  description: string;
  detail?: string | null;
  actionLabel?: string;
  actionHref?: string;
  onRetry?: () => void;
  retryLabel?: string;
  tone?: "warning" | "critical" | "neutral";
  compact?: boolean;
};

const toneClasses: Record<NonNullable<WorkspaceStatusPanelProps["tone"]>, string> = {
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  critical: "border-rose-200 bg-rose-50 text-rose-950",
  neutral: "border-slate-200 bg-white text-slate-950",
};

export function WorkspaceStatusPanel({
  title,
  description,
  detail,
  actionLabel,
  actionHref,
  onRetry,
  retryLabel = "Retry",
  tone = "warning",
  compact = false,
}: WorkspaceStatusPanelProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border shadow-sm",
        toneClasses[tone],
        compact ? "p-4" : "p-6 sm:p-7"
      )}
    >
      <div className={cn("flex gap-4", compact ? "items-start" : "items-start sm:items-center")}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-current shadow-sm">
          {tone === "critical" ? (
            <ShieldAlert className="h-5 w-5" />
          ) : tone === "warning" ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <Settings2 className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className={cn("font-semibold tracking-[-0.02em]", compact ? "text-base" : "text-xl")}>{title}</h2>
          <p className={cn("mt-2 leading-6 opacity-90", compact ? "text-sm" : "text-sm sm:text-[15px]")}>
            {description}
          </p>
          {detail ? (
            <p className={cn("mt-2 opacity-75", compact ? "text-xs leading-5" : "text-sm leading-6")}>{detail}</p>
          ) : null}

          {(onRetry || (actionLabel && actionHref)) ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {onRetry ? (
                <Button type="button" variant="outline" onClick={onRetry}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {retryLabel}
                </Button>
              ) : null}
              {actionLabel && actionHref ? (
                <Button asChild>
                  <Link href={actionHref}>{actionLabel}</Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
