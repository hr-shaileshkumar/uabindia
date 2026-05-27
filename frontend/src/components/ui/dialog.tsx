import * as React from "react";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-4xl" role="dialog" aria-modal="true">
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
      className={`relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl ${className}`}
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
    <div className={`border-b border-slate-200 px-6 py-5 ${className}`} {...props}>
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
