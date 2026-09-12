"use client";

type ToastVariant = "success" | "error" | "warning" | "info" | "default";

type ToastOptions = {
  title?: string;
  description?: string;
  message?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

export function useToast() {
  const toast = (opts: ToastOptions) => {
    if (typeof window === "undefined") return;

    const detail = {
      variant: opts.variant ?? "info",
      title: opts.title ?? (opts.variant === "success" ? "Success" : opts.variant === "error" ? "Error" : "Info"),
      message: opts.description ?? opts.message ?? "",
      durationMs: opts.durationMs ?? 4500,
    };

    window.dispatchEvent(new CustomEvent("erp:notify", { detail }));
  };

  return { toast };
}

export default useToast;
