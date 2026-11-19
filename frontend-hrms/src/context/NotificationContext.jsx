import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, title = "") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newToast = { id, type, message, title };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const notifySuccess = useCallback((message, title = "Success") => {
    addToast("success", message, title);
  }, [addToast]);

  const notifyError = useCallback((message, title = "Error") => {
    addToast("error", message, title);
  }, [addToast]);

  const notifyWarning = useCallback((message, title = "Warning") => {
    addToast("warning", message, title);
  }, [addToast]);

  const notifyInfo = useCallback((message, title = "Information") => {
    addToast("info", message, title);
  }, [addToast]);

  return (
    <NotificationContext.Provider
      value={{ notifySuccess, notifyError, notifyWarning, notifyInfo }}
    >
      {children}
      {/* Toast rendering container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";
          const isWarning = toast.type === "warning";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-200 animate-in slide-in-from-bottom-5 ${
                isSuccess
                  ? "bg-emerald-50/95 border-emerald-200 text-emerald-900"
                  : isError
                  ? "bg-rose-50/95 border-rose-200 text-rose-900"
                  : isWarning
                  ? "bg-amber-50/95 border-amber-200 text-amber-900"
                  : "bg-slate-900/95 border-slate-700 text-white"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-600" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-indigo-400" />}
              </div>
              <div className="flex-1 min-w-0">
                {toast.title && <div className="text-xs font-bold tracking-tight mb-0.5">{toast.title}</div>}
                <div className="text-xs leading-relaxed opacity-90">{toast.message}</div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return ctx;
};
