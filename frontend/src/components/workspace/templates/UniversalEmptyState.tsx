"use client";

import type { ReactNode } from "react";
import { FolderOpen } from "lucide-react";
import { erpButtonClassName } from "@/components/workspace/styles";

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
  icon = <FolderOpen className="h-10 w-10 text-slate-500" />,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
}: UniversalEmptyStateProps) {
  return (
    <div className="my-4 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
        {icon}
      </div>
      <h3 className="mb-1 text-lg font-bold text-slate-900">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-slate-500">{description}</p>

      <div className="flex flex-wrap items-center gap-3">
        {primaryActionLabel && onPrimaryAction ? (
          <button type="button" onClick={onPrimaryAction} className={erpButtonClassName.primary}>
            {primaryActionLabel}
          </button>
        ) : null}
        {secondaryActionLabel && onSecondaryAction ? (
          <button type="button" onClick={onSecondaryAction} className={erpButtonClassName.secondary}>
            {secondaryActionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
