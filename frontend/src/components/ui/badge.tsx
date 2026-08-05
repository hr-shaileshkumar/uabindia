import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badge component for displaying status labels and tags
 * 
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning">Pending</Badge>
 * <Badge variant="destructive">Disabled</Badge>
 * <Badge variant="outline" className="text-sm">Custom</Badge>
 * ```
 */
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-[var(--erp-radius-control)] border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--erp-ring)] focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--erp-primary)] text-white hover:bg-[var(--erp-primary-hover)]",
        secondary: "border-transparent bg-[var(--erp-surface-muted)] text-[var(--erp-ink)] hover:bg-[var(--erp-surface-muted)]/80",
        destructive: "border-transparent bg-[var(--erp-danger-bg)] text-[var(--erp-danger)] hover:bg-[var(--erp-danger)]/10",
        success: "border-transparent bg-[var(--erp-success-bg)] text-[var(--erp-success)] hover:bg-[var(--erp-success)]/10",
        warning: "border-transparent bg-[var(--erp-warning-bg)] text-[var(--erp-warning)] hover:bg-[var(--erp-warning)]/10",
        outline: "text-[var(--erp-ink)] hover:bg-[var(--erp-surface-muted)]",
        info: "border-transparent bg-[var(--erp-info-bg)] text-[var(--erp-info)] hover:bg-[var(--erp-info)]/10",
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

export { Badge, badgeVariants };