"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open || !mounted) return null;

  const content = (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="fixed inset-0 bg-slate-950/35 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-150"
        onClick={() => onOpenChange(false)}
      />
      <div
        className="relative z-10 max-h-[100dvh] w-full max-w-4xl overflow-y-auto sm:max-h-[calc(100dvh-2rem)] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function DialogContent({ className = "", children, ...props }: DialogContentProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
      onClick={(event) => event.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
}

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function DialogHeader({ className = "", children, ...props }: DialogHeaderProps) {
  return (
    <div className={cn("border-b border-slate-100 px-5 py-4 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40", className)} {...props}>
      {children}
    </div>
  );
}

export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function DialogTitle({ className = "", children, ...props }: DialogTitleProps) {
  return (
    <h2 className={cn("text-lg font-bold text-slate-900 dark:text-white", className)} {...props}>
      {children}
    </h2>
  );
}

export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function DialogDescription({ className = "", children, ...props }: DialogDescriptionProps) {
  return (
    <p className={cn("mt-1 text-xs text-slate-500 dark:text-slate-400", className)} {...props}>
      {children}
    </p>
  );
}

export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function DialogFooter({ className = "", children, ...props }: DialogFooterProps) {
  return (
    <div className={cn("border-t border-slate-100 px-5 py-3.5 bg-slate-50/50 flex items-center justify-end gap-2 dark:border-slate-800 dark:bg-slate-950/40", className)} {...props}>
      {children}
    </div>
  );
}
