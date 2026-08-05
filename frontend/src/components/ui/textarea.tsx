"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Textarea component with ERP design system tokens
 * 
 * @example
 * ```tsx
 * <Textarea placeholder="Enter your message..." />
 * <Textarea value={description} onChange={handleDescriptionChange} rows={4} />
 * <Textarea variant="outline" className="max-w-lg" />
 * ```
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: "default" | "outline";
  size?: "sm" | "default" | "lg";
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "flex w-full rounded-[var(--erp-radius-control)] border bg-white placeholder:text-[var(--erp-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--erp-ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[var(--erp-border)] dark:bg-[var(--erp-surface)] dark:placeholder:text-[var(--erp-muted-soft)]";

    const variants: Record<NonNullable<TextareaProps["variant"]>, string> = {
      default: "border-[var(--erp-border)] focus-visible:ring-[var(--erp-ring)]",
      outline: "border-[var(--erp-border)] bg-transparent focus-visible:ring-[var(--erp-primary)]",
    };

    const sizes: Record<NonNullable<TextareaProps["size"]>, string> = {
      sm: "h-24 text-sm",
      default: "h-32 text-sm",
      lg: "h-48 text-base",
    };

    return (
      <textarea
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
