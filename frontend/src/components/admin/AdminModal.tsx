"use client";

import { useEffect, type ReactNode } from "react";

export type ModalType = "default" | "success" | "warning" | "danger";
export type ModalSize = "sm" | "md" | "lg" | "xl";

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  type?: ModalType;
  size?: ModalSize;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmLoading?: boolean;
  cancelLabel?: string;
  hideClose?: boolean;
};

const TYPE_ICONS: Record<ModalType, ReactNode> = {
  default: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  success: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  warning: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  danger: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
};

export default function AdminModal({
  open,
  title,
  subtitle,
  type = "default",
  size = "md",
  onClose,
  children,
  footer,
  onConfirm,
  confirmLabel = "Save",
  confirmLoading = false,
  cancelLabel = "Cancel",
  hideClose = false,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const accentClass =
    type === "success" ? "erp-modal-accent erp-modal-accent-success"
    : type === "warning" ? "erp-modal-accent erp-modal-accent-warning"
    : type === "danger"  ? "erp-modal-accent erp-modal-accent-danger"
    : "erp-modal-accent";

  const iconClass =
    type === "success" ? "erp-modal-icon erp-modal-icon-success"
    : type === "warning" ? "erp-modal-icon erp-modal-icon-warning"
    : type === "danger"  ? "erp-modal-icon erp-modal-icon-danger"
    : "erp-modal-icon";

  const confirmBtnClass =
    type === "danger"  ? "erp-action-btn erp-action-btn-danger"
    : type === "success" ? "erp-action-btn erp-action-btn-success"
    : type === "warning" ? "erp-action-btn erp-action-btn-warning"
    : "erp-action-btn erp-action-btn-primary";

  const hasFooter = footer !== undefined || onConfirm !== undefined;

  return (
    <div className="erp-modal-backdrop" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`erp-modal-card erp-modal-${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={accentClass} />
        <div className="erp-modal-header">
          <div className="flex min-w-0 items-center gap-3">
            <span className={iconClass}>{TYPE_ICONS[type]}</span>
            <div className="min-w-0">
              <div className="erp-modal-title">{title}</div>
              {subtitle ? <div className="erp-modal-subtitle">{subtitle}</div> : null}
            </div>
          </div>
          {!hideClose && (
            <button type="button" className="erp-modal-close" onClick={onClose} title="Close (Esc)">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </div>
        <div className="erp-modal-body">{children}</div>
        {hasFooter && (
          <div className="erp-modal-footer">
            {footer ?? (
              <>
                <button type="button" className="erp-action-btn erp-action-btn-secondary" onClick={onClose}>
                  {cancelLabel}
                </button>
                <button type="button" className={confirmBtnClass} onClick={onConfirm} disabled={confirmLoading}>
                  {confirmLoading ? "Saving…" : confirmLabel}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
