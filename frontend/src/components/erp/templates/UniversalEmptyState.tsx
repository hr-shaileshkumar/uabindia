"use client";

import type { ReactNode } from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface UniversalEmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function UniversalEmptyState({
  title = "No Records Found",
  description = "Get started by adding your first record or importing existing master data.",
  icon = <FolderOpen className="h-10 w-10 text-indigo-500/80" />,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
}: UniversalEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs my-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">{description}</p>
      
      <div className="flex flex-wrap items-center gap-3">
        {primaryActionLabel && onPrimaryAction ? (
          <Button onClick={onPrimaryAction} className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5">
            {primaryActionLabel}
          </Button>
        ) : null}
        {secondaryActionLabel && onSecondaryAction ? (
          <Button variant="outline" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
