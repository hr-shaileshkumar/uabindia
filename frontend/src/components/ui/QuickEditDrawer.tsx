"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

type QuickEditDrawerProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onSave?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  saving?: boolean;
  side?: "left" | "right";
  children: ReactNode;
};

export default function QuickEditDrawer({
  open,
  title,
  subtitle,
  onClose,
  onSave,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  saving = false,
  side = "right",
  children,
}: QuickEditDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="erp-drawer-overlay" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`erp-drawer-panel erp-drawer-panel-action ${side === "left" ? "erp-drawer-panel-left" : "erp-drawer-panel-right"}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="erp-drawer-header">
          <div>
            <div className="erp-drawer-title">{title}</div>
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="erp-drawer-close" title="Close" aria-label={`Close ${title}`}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="erp-drawer-body">
          <div className="space-y-4">{children}</div>
          <div className="erp-form-actions mt-6 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="erp-action-btn erp-action-btn-secondary">
              {cancelLabel}
            </button>
            {onSave ? (
              <button type="button" onClick={onSave} disabled={saving} className="erp-action-btn erp-action-btn-primary">
                {saving ? "Saving..." : saveLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
