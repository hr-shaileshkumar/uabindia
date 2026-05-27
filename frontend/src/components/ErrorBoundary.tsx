"use client";

import React from "react";
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from "react-error-boundary";

function PageErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const message = error instanceof Error
    ? error.message
    : "An unexpected error occurred while rendering this page.";

  return (
      <div className="flex min-h-100 flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <svg
          className="h-6 w-6 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-base font-semibold text-red-800">Something went wrong</h2>
        <p className="mt-1 text-sm text-red-600">
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400"
      >
        Try again
      </button>
    </div>
  );
}

/** Wrap any page or section that may throw during render. */
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary FallbackComponent={PageErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
}

export default PageErrorBoundary;
