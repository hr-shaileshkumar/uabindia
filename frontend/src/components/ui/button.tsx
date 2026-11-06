import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg border border-transparent font-semibold tracking-tight shadow-sm transition-[background-color,border-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900",
        secondary:
          "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-400",
        outline:
          "border-slate-900 bg-transparent text-slate-900 hover:bg-slate-900 hover:text-white focus-visible:ring-slate-900",
        ghost:
          "border-transparent bg-transparent text-slate-600 shadow-none hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400",
        destructive:
          "border-rose-600 bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600",
        success:
          "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500",
        warning:
          "border-amber-500 bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-400",
        "ghost-danger":
          "border-transparent bg-transparent text-rose-600 shadow-none hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-rose-500",
      },
      size: {
        default: "h-10 px-5 text-sm",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-5 text-sm",
        icon: "h-8 w-8 p-0 rounded-lg shadow-sm",
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
    const classes = cn(buttonVariants({ variant, size }), className);

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        className: cn(classes, child.props.className),
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
