import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-[var(--erp-radius-control)] border border-transparent font-semibold tracking-[0.01em] shadow-sm transition-[background-color,border-color,color,box-shadow,transform] hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-[var(--erp-primary)]",
  {
    variants: {
      variant: {
        default:
          "border border-[var(--erp-primary)]/45 bg-[linear-gradient(135deg,var(--erp-primary-hover),var(--erp-primary)_62%,var(--erp-accent))] text-white shadow-[0_10px_22px_rgba(15,54,83,0.16)] hover:brightness-105 focus-visible:ring-offset-0",
        secondary:
          "border border-[var(--erp-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(252,246,239,0.94))] text-[var(--erp-ink)] shadow-[0_8px_18px_rgba(15,23,42,0.05)] hover:border-[var(--erp-border-strong)] hover:bg-white focus-visible:ring-slate-400",
        outline:
          "border border-[var(--erp-border)] bg-white/92 text-[var(--erp-ink)] hover:border-[var(--erp-border-strong)] hover:bg-white focus-visible:ring-offset-0",
        ghost:
          "border-transparent bg-transparent text-[var(--erp-muted)] shadow-none hover:bg-white/80 hover:text-[var(--erp-ink)]",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 focus-visible:ring-offset-0",
        success:
          "bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600/20 focus-visible:ring-emerald-500",
        warning:
          "bg-amber-500 text-white hover:bg-amber-600 border border-amber-500/20 focus-visible:ring-amber-400",
        "ghost-danger":
          "border-transparent bg-transparent text-red-600 shadow-none hover:bg-red-50 hover:text-red-700",
      },
      size: {
        default: "h-10 px-4 text-sm",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-5 text-sm",
        icon: "h-8 w-8 p-0 rounded-[0.75rem] shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant, size = "default", type = "button", asChild = false, children, ...props }, ref) => {
    const classes = `${buttonVariants({ variant, size, className })}`;

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        className: `${classes} ${String(child.props.className || "")}`.trim(),
      });
    }

    return (
      <button
        data-erp-button="true"
        type={type}
        className={classes}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
