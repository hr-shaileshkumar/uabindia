"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Uncaught runtime error in component subtree:", error, errorInfo);
    }
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="my-6 rounded-2xl border border-red-200 bg-red-50/70 p-6 text-slate-800 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 font-bold text-red-600">
              !
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-red-900">
                {this.props.fallbackTitle || "An unexpected error occurred in this view."}
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {this.state.error?.message ||
                  this.props.fallbackMessage ||
                  "Something went wrong while rendering this section."}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.location.reload();
                    }
                  }}
                  className="rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-800 transition hover:bg-red-50"
                >
                  Reload Screen
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
