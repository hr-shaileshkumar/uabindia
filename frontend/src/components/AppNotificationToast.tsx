"use client";

import { useEffect, useMemo, useState } from "react";

type ToastItem = {
  id: string;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  durationMs: number;
};

type NotifyDetail = {
  variant?: "success" | "error" | "warning" | "info";
  title?: string;
  message?: string;
  durationMs?: number;
};

const styleMap: Record<ToastItem["variant"], { ring: string; title: string; body: string }> = {
  success: {
    ring: "border-emerald-200 bg-emerald-50",
    title: "text-emerald-800",
    body: "text-emerald-700",
  },
  error: {
    ring: "border-red-200 bg-red-50",
    title: "text-red-800",
    body: "text-red-700",
  },
  warning: {
    ring: "border-amber-200 bg-amber-50",
    title: "text-amber-800",
    body: "text-amber-700",
  },
  info: {
    ring: "border-sky-200 bg-sky-50",
    title: "text-sky-800",
    body: "text-sky-700",
  },
};

const defaultTitle = (variant: ToastItem["variant"]) => {
  switch (variant) {
    case "success":
      return "Success";
    case "error":
      return "Error";
    case "warning":
      return "Warning";
    default:
      return "Info";
  }
};

export default function AppNotificationToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onNotify = (event: Event) => {
      const detail = (event as CustomEvent<NotifyDetail>).detail;
      if (!detail?.message) return;

      const variant = detail.variant ?? "info";
      const toast: ToastItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        variant,
        title: detail.title || defaultTitle(variant),
        message: detail.message,
        durationMs: detail.durationMs ?? 4500,
      };

      setToasts((prev) => [toast, ...prev].slice(0, 5));
    };

    window.addEventListener("erp:notify", onNotify as EventListener);

    return () => {
      window.removeEventListener("erp:notify", onNotify as EventListener);
    };
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.durationMs)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [toasts]);

  const rendered = useMemo(
    () =>
      toasts.map((toast) => {
        const styles = styleMap[toast.variant];
        return (
          <div key={toast.id} className={`w-90 max-w-[calc(100vw-2rem)] rounded-xl border p-4 shadow-lg ${styles.ring}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-sm font-semibold ${styles.title}`}>{toast.title}</p>
                <p className={`mt-1 text-xs ${styles.body}`}>{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="rounded-md px-1.5 py-0.5 text-xs text-slate-500 hover:bg-white/70 hover:text-slate-700"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          </div>
        );
      }),
    [toasts]
  );

  if (toasts.length === 0) return null;

  return <div className="fixed right-5 top-5 z-100 space-y-3">{rendered}</div>;
}
