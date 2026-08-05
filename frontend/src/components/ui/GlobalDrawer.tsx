"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

type GlobalDrawerProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onSave?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  saving?: boolean;
  children: ReactNode;
};

export default function GlobalDrawer({
  open,
  title,
  subtitle,
  onClose,
  onSave,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  saving = false,
  children,
}: GlobalDrawerProps) {
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
    <div className="global-drawer-overlay" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="global-drawer-panel"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header Gutter */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-slate-50/50">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">{title}</h2>
            {subtitle ? <p className="mt-1 text-xs text-slate-500 font-semibold">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {children}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            {cancelLabel}
          </button>
          {onSave ? (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : saveLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
