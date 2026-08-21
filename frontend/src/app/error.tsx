"use client";

import PublicStatusPage from "@/components/public/PublicStatusPage";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const reloadPage = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicStatusPage
        eyebrow="Application error"
        title="We hit a snag while loading this screen."
        description={error.message || "An unexpected runtime error occurred while rendering the current page."}
        note="Try retrying the screen first. If the issue persists, reload the app or return to a stable route."
        actions={[
          { href: "/", label: "Open public site", variant: "secondary" },
        ]}
      />
      <div className="-mt-36 flex justify-center px-6 pb-12">
        <div className="flex flex-wrap justify-center gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Retry this screen
          </button>
          <button
            type="button"
            onClick={reloadPage}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Reload app
          </button>
        </div>
      </div>
    </div>
  );
}
