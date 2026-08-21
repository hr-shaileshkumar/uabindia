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
          "flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-500",
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