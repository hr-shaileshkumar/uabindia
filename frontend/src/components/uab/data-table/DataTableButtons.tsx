"use client";

import { Download, RefreshCw, Trash2 } from "lucide-react";
import { erpButtonClassName } from "@/components/workspace/styles";
import { cn } from "@/lib/utils";

/** Compact refresh used next to Columns / Actions. */
export function ErpListRefreshButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={loading} className={erpButtonClassName.secondary}>
      <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
      Refresh
    </button>
  );
}

export function ErpListDeleteHint({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-slate-500", className)}>
      <Trash2 className="h-3 w-3" />
      Select rows, then Actions
    </span>
  );
}

export function ErpListExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={erpButtonClassName.ghost}>
      <Download className="h-3.5 w-3.5" />
      Export
    </button>
  );
}
