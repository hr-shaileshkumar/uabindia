"use client";

import { useEffect, useMemo, useState } from "react";

type ApiErrorDetail = {
  status?: number;
  message?: string;
  url?: string;
  method?: string;
};

const isNoisyStatus = (status?: number) => status === 401;

export default function ApiErrorToast() {
  const [error, setError] = useState<ApiErrorDetail | null>(null);

  useEffect(() => {
    let timer: number | null = null;

    const onApiError = (event: Event) => {
      const customEvent = event as CustomEvent<ApiErrorDetail>;
      const detail = customEvent.detail;
      if (!detail || isNoisyStatus(detail.status)) return;

      setError(detail);
      if (timer) {
        window.clearTimeout(timer);
      }
      timer = window.setTimeout(() => {
        setError(null);
      }, 5000);
    };

    window.addEventListener("erp:api-error", onApiError as EventListener);
    return () => {
      window.removeEventListener("erp:api-error", onApiError as EventListener);
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  const title = useMemo(() => {
    if (!error?.status) return "Something went wrong";
    if (error.status >= 500) return "Server error";
    if (error.status >= 400) return "Request failed";
    return "API error";
  }, [error?.status]);

  if (!error) return null;

  return (
    <div className="fixed bottom-5 right-5 z-100 w-90 max-w-[calc(100vw-2rem)] rounded-xl border border-red-200 bg-white p-4 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-red-700">{title}</p>
          <p className="mt-1 text-xs text-slate-700">{error.message || "Unexpected API error"}</p>
          {error.url && (
            <p className="mt-1 text-[11px] text-slate-500">
              {error.method?.toUpperCase() || "GET"} {error.url}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setError(null)}
          className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          aria-label="Dismiss API error"
        >
          X
        </button>
      </div>
    </div>
  );
}

