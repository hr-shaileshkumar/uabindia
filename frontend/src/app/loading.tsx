"use client";

import { useEffect, useState } from "react";

export default function GlobalLoading() {
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      {/* Blurred background glow blobs */}
      <div className="absolute left-1/4 top-1/4 h-80 w-80 rounded-full bg-indigo-500/5 blur-[90px] pointer-events-none" />
      <div className="absolute right-1/4 bottom-1/4 h-72 w-72 rounded-full bg-cyan-500/5 blur-[80px] pointer-events-none" />

      {/* Main loading card */}
      <div className="relative w-full max-w-[400px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-[0_16px_48px_rgba(15,23,42,0.06)]">
        {/* Top brand line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 animate-pulse" />

        {/* Logo */}
        <div className="mb-6 flex justify-center items-center gap-2">
          <img src="/logo.png" alt="Uabindia logo" className="h-6 w-auto object-contain" />
          <span className="text-sm font-bold tracking-wider text-slate-800">ERP</span>
        </div>

        {/* Loader Spinner */}
        <div className="relative mb-6 flex justify-center">
          {/* Circular revolving loader ring */}
          <div className="h-14 w-14 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
        </div>

        {/* Status text */}
        <p className="text-sm font-semibold text-slate-700 animate-pulse transition-all duration-300">
          {statusText}
        </p>

        {/* Progress bar */}
        <div className="mt-5 overflow-hidden h-1.5 w-full bg-slate-100 rounded-full relative">
          <div className="h-full bg-indigo-600 rounded-full absolute left-0 top-0 animate-[loading-progress_2.5s_ease-in-out_infinite]" />
        </div>

        <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Secured with industry-standard SSL
        </p>
      </div>
    </div>
  );
}
