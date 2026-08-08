"use client";

import { useEffect, useState } from "react";
import { RoundArcSpinner } from "@/components/ui/GlobalLoading";

export default function AppRouteLoading() {
  const [statusText, setStatusText] = useState("Initializing workspace shell...");

  useEffect(() => {
    const statuses = [
      "Initializing workspace shell...",
      "Resolving tenant credentials...",
      "Connecting to secure database...",
      "Loading permissions and menus...",
      "Rendering workspace views...",
    ];

    let current = 0;
    const interval = setInterval(() => {
      current = (current + 1) % statuses.length;
      setStatusText(statuses[current]);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4">
      {/* Blurred background glow blobs */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-80 w-80 rounded-full bg-blue-500/5 blur-[90px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-72 w-72 rounded-full bg-teal-500/5 blur-[80px]" />

      {/* Main loading card */}
      <div className="relative w-full max-w-[400px] overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-8 text-center shadow-[0_16px_48px_-12px_rgba(15,23,42,0.12)] backdrop-blur-md">
        {/* Top Accent Gradient Line */}
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-600" />

        {/* Logo */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <img src="/logo.png" alt="Uabindia logo" className="h-6 w-auto object-contain" />
          <span className="text-sm font-bold tracking-wider text-slate-800">ERP</span>
        </div>

        {/* Universal Round Arc Spinner */}
        <div className="mb-6 flex justify-center">
          <RoundArcSpinner size="xl" />
        </div>

        {/* Status text */}
        <p className="text-sm font-semibold text-slate-700 transition-all duration-300">
          {statusText}
        </p>

        {/* Progress bar */}
        <div className="relative mt-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-blue-600 to-teal-500 animate-[loading-progress_2.5s_ease-in-out_infinite]" />
        </div>

        <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Secured with industry-standard SSL
        </p>
      </div>
    </div>
  );
}
