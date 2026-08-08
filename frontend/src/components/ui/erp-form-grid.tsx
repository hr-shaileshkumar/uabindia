import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

export interface ERPFormGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ERPFormGrid({
  columns = 2,
  title,
  description,
  children,
  className = "",
  ...props
}: ERPFormGridProps) {
  const colClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-xs", className)} {...props}>
      {(title || description) && (
        <div className="border-b border-[var(--border-subtle)] pb-3 mb-4">
          {title && <h3 className="text-sm font-semibold text-[var(--text-main)]">{title}</h3>}
          {description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>}
        </div>
      )}
      <div className={cn("grid gap-4", colClasses[columns])}>
        {children}
      </div>
    </div>
  );
}

export interface ERPFormFieldProps {
  label: string;
  required?: boolean;
  htmlFor?: string;
  error?: string;
  warning?: string;
  success?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 4;
}

export function ERPFormField({
  label,
  required,
  htmlFor,
  error,
  warning,
  success,
  helperText,
  children,
  className = "",
  colSpan,
}: ERPFormFieldProps) {
  const spanClasses = colSpan
    ? {
        1: "col-span-1",
        2: "col-span-1 md:col-span-2",
        3: "col-span-1 md:col-span-3",
        4: "col-span-1 md:col-span-4",
      }[colSpan]
    : "";

  return (
    <div className={cn("flex flex-col gap-1.5", spanClasses, className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-[var(--text-main)] flex items-center justify-between">
        <span>
          {label}
          {required && <span className="text-[var(--danger)] ml-0.5">*</span>}
        </span>
      </label>
      
      {children}

      {error ? (
        <div className="flex items-center gap-1 text-xs text-[var(--danger)] mt-0.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : warning ? (
        <div className="flex items-center gap-1 text-xs text-[var(--warning)] mt-0.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{warning}</span>
        </div>
      ) : success ? (
        <div className="flex items-center gap-1 text-xs text-[var(--success)] mt-0.5">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>{success}</span>
        </div>
      ) : helperText ? (
        <p className="text-3xs text-[var(--text-muted)] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}
