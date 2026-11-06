"use client";

import { useCallback, useMemo, useState } from "react";

type ConfirmVariant = "primary" | "danger";

export type ConfirmDialogOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
};

type PendingConfirm = ConfirmDialogOptions & {
  resolve: (value: boolean) => void;
};

export function useConfirmDialog() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({
        title: options.title ?? "Please confirm",
        message: options.message,
        confirmText: options.confirmText ?? "Confirm",
        cancelText: options.cancelText ?? "Cancel",
        variant: options.variant ?? "primary",
        resolve,
      });
    });
  }, []);

  const close = useCallback((result: boolean) => {
    setPending((current) => {
      if (current) {
        current.resolve(result);
      }
      return null;
    });
  }, []);

  const confirmDialog = useMemo(() => {
    if (!pending) return null;

    const confirmClass = pending.variant === "danger"
      ? "erp-action-btn erp-action-btn-danger"
      : "erp-action-btn erp-action-btn-primary";

    return (
      <div className="erp-modal-backdrop" onClick={() => close(false)}>
        <div className="erp-modal-card erp-modal-sm" onClick={(e) => e.stopPropagation()}>
          <div className={pending.variant === "danger" ? "erp-modal-accent erp-modal-accent-danger" : "erp-modal-accent"} />
          <div className="erp-modal-header">
            <div className="flex min-w-0 items-center gap-3">
              <span className={pending.variant === "danger" ? "erp-modal-icon erp-modal-icon-danger" : "erp-modal-icon"}>
                {pending.variant === "danger" ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </span>
              <div className="min-w-0">
                <div className="erp-modal-title">{pending.title}</div>
              </div>
            </div>
            <button type="button" className="erp-modal-close" onClick={() => close(false)} title="Cancel">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <div className="erp-modal-body text-sm text-slate-600 leading-relaxed">{pending.message}</div>
          <div className="erp-modal-footer">
            <button type="button" className="erp-action-btn erp-action-btn-secondary" onClick={() => close(false)}>
              {pending.cancelText}
            </button>
            <button type="button" className={confirmClass} onClick={() => close(true)}>
              {pending.confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  }, [close, pending]);

  return { confirm, confirmDialog };
}
