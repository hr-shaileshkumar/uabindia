"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-rose-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">Application Error</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">Something broke while loading this screen.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {error.message || "An unexpected error occurred. Try the request again."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
