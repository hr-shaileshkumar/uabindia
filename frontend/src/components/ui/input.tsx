import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Input component with ERP design system tokens
 * 
 * @example
 * ```tsx
 * <Input placeholder="Enter text" />
 * <Input value={name} onChange={handleNameChange} />
 * <Input variant="outline" className="max-w-sm" />
 * ```
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", style, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-[var(--erp-radius-control)] border border-[var(--erp-border)] bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-[var(--erp-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--erp-ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[var(--erp-border)] dark:bg-[var(--erp-surface)] dark:ring-offset-[var(--erp-surface)] dark:placeholder:text-[var(--erp-muted-soft)]",
          className
        )}
        style={style}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };