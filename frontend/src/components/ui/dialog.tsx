"use client";

import * as React from "react";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 max-h-[100dvh] w-full max-w-4xl overflow-y-auto sm:max-h-[calc(100dvh-2rem)]" role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function DialogContent({ className = "", children, ...props }: DialogContentProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-t-xl border border-slate-200 bg-white shadow-2xl sm:rounded-xl ${className}`}
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
    <div className={`border-b border-slate-200 px-4 py-3.5 sm:px-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function DialogTitle({ className = "", children, ...props }: DialogTitleProps) {
  return (
    <h2 className={`text-xl font-semibold text-slate-900 ${className}`} {...props}>
      {children}
    </h2>
  );
}

export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function DialogDescription({ className = "", children, ...props }: DialogDescriptionProps) {
  return (
    <p className={`text-sm text-slate-600 ${className}`} {...props}>
      {children}
    </p>
  );
}

export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function DialogFooter({ className = "", children, ...props }: DialogFooterProps) {
  return (
    <div className={`border-t border-slate-200 px-4 py-3 sm:px-5 ${className}`} {...props}>
      {children}
    </div>
  );
}
