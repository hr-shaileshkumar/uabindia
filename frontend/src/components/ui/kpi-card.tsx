import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface KPICardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
    neutral?: boolean;
    label?: string;
  };
  badgeText?: string;
  badgeVariant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export const KPICard = React.forwardRef<HTMLDivElement, KPICardProps>(
  ({ className = "", title, value, description, icon, trend, badgeText, badgeVariant, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "relative overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-all hover:border-[var(--border-strong)] hover:shadow-md",
          className
        )}
        {...props}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            {title}
          </CardTitle>
          {icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary-subtle)] text-[var(--primary)] shrink-0">
              {icon}
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-2xl font-bold tracking-tight text-[var(--text-main)]">{value}</div>
            {badgeText && (
              <span className="inline-flex items-center rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-2xs font-semibold text-[var(--text-muted)]">
                {badgeText}
              </span>
            )}
          </div>

          {(description || trend) && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-2xs font-semibold",
                    trend.neutral
                      ? "bg-[var(--bg-muted)] text-[var(--text-muted)]"
                      : trend.positive
                      ? "bg-[var(--success-bg)] text-[var(--success)]"
                      : "bg-[var(--danger-bg)] text-[var(--danger)]"
                  )}
                >
                  {trend.neutral ? (
                    <Minus className="h-3 w-3" />
                  ) : trend.positive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {trend.value}
                </span>
              )}
              {description && (
                <span className="text-[var(--text-muted)] truncate">
                  {trend?.label || description}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

KPICard.displayName = "KPICard";
