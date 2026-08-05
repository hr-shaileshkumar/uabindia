"use client";

import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  backHref?: string;
  className?: string;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions, backHref, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 pb-4 border-b border-border", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-xs text-muted-foreground">
            {breadcrumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
                {crumb.href && i < breadcrumbs.length - 1 ? (
                  <Link href={crumb.href} className="hover:text-foreground transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={i === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="shrink-0 flex items-center justify-center h-8 w-8 rounded-md border border-border bg-background hover:bg-muted transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground truncate">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground truncate">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
