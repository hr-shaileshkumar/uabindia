"use client";

import Link from "next/link";
import { AlertTriangle, Settings2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArcLoader } from "@/components/erp/arc-loader";

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
  warning: "border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,251,235,0.98),rgba(255,255,255,0.98))] text-amber-950",
  critical: "border-rose-200/80 bg-[linear-gradient(180deg,rgba(255,241,242,0.98),rgba(255,255,255,0.98))] text-rose-950",
  neutral: "border-slate-200/90 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] text-slate-950",
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
        "rounded-[var(--erp-radius-panel)] border shadow-[var(--erp-shadow-sm)]",
        toneClasses[tone],
        compact ? "p-3.5" : "p-4 sm:p-5"
      )}
    >
      <div className={cn("flex gap-4", compact ? "items-start" : "items-start sm:items-center")}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/90 text-current shadow-sm">
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
                  <ArcLoader size="sm" className="mr-2" label="Retrying workspace" />
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
