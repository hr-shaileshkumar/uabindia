import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { StatusBadge, type StatusBadgeProps } from "./status-badge";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]",
        secondary: "border-transparent bg-[var(--bg-muted)] text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]",
        destructive: "border-transparent bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger)]/20",
        success: "border-transparent bg-[var(--success-bg)] text-[var(--success)] border-[var(--success)]/20",
        warning: "border-transparent bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning)]/20",
        info: "border-transparent bg-[var(--info-bg)] text-[var(--info)] border-[var(--info)]/20",
        outline: "border-[var(--border-subtle)] text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = "", variant, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants, StatusBadge };