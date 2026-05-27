export type NotifyVariant = "success" | "error" | "warning" | "info";

export type NotifyPayload = {
  variant: NotifyVariant;
  title?: string;
  message: string;
  durationMs?: number;
};

export const notify = (payload: NotifyPayload) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("erp:notify", { detail: payload }));
};

export const notifySuccess = (message: string, title = "Success") =>
  notify({ variant: "success", title, message });

export const notifyError = (message: string, title = "Error") =>
  notify({ variant: "error", title, message });

export const notifyWarning = (message: string, title = "Warning") =>
  notify({ variant: "warning", title, message });

export const notifyInfo = (message: string, title = "Info") =>
  notify({ variant: "info", title, message });
