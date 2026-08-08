"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface AppShellProps {
  title?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AppShell({
  title,
  description,
  breadcrumbs,
  actions,
  filters,
  children,
  className = "",
}: AppShellProps) {
  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Dynamic Page Header & Breadcrumb Bar */}
      {(title || breadcrumbs || actions) && (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-xs transition-colors">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-3">
              <Link
                href="/dashboard"
                className="hover:text-[var(--primary)] transition-colors flex items-center gap-1"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </Link>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <ChevronRight className="h-3 w-3 text-[var(--text-subtle)]" />
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-[var(--primary)] transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-[var(--text-main)]">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}

          {/* Page Title & Actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              {title && (
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)]">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-3xl leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {actions && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Optional Filter Bar */}
      {filters && (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 shadow-xs">
          {filters}
        </div>
      )}

      {/* Page Workspace Content */}
      <div className="space-y-6">{children}</div>
    </div>
  );
}

export default AppShell;
