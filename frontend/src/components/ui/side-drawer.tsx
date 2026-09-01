"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useNavigationStore } from "@/store/navigationStore";
import { cn } from "@/lib/utils";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  side?: "right" | "left";
}

export const ERP_WORKSPACE_CONTENT_ID = "erp-workspace-content";

const widthClasses: Record<NonNullable<SideDrawerProps["width"]>, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
  "2xl": "max-w-4xl",
  full: "max-w-full",
};

export function SideDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = "lg",
  side = "right",
}: SideDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const _isSidebarCollapsed = useNavigationStore((state) => state.isSidebarCollapsed);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!mounted) return;
    const host = document.getElementById(ERP_WORKSPACE_CONTENT_ID);
    if (!host) return;
    if (open) {
      host.dataset.erpFormOpen = "true";
      host.scrollTop = 0;
    } else {
      delete host.dataset.erpFormOpen;
    }
    return () => {
      delete host?.dataset.erpFormOpen;
    };
  }, [open, mounted]);

  if (!open || !mounted) return null;

  const maxWClass = widthClasses[width] || "max-w-2xl";

  const panel = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={cn(
        "fixed inset-0 z-[100] flex",
        side === "left" ? "justify-start" : "justify-end"
      )}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div
        className={cn(
          "relative z-10 flex h-full w-full flex-col bg-white shadow-2xl border-l border-slate-200 dark:border-slate-800 dark:bg-slate-900",
          side === "left" ? "animate-in slide-in-from-left duration-250 ease-out" : "animate-in slide-in-from-right duration-250 ease-out",
          maxWClass
        )}
      >
        {/* Drawer Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50/90 px-5 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/90">
          <div className="min-w-0 flex-1 pr-3">
            <h2 className="truncate text-base font-bold text-slate-900 dark:text-white">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-slate-500 leading-normal line-clamp-1 dark:text-slate-400">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 scrollbar-thin dark:bg-slate-900">{children}</div>

        {/* Drawer Sticky Footer */}
        {footer ? (
          <div className="shrink-0 border-t border-slate-200 bg-slate-50/95 px-5 py-3.5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/90">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(panel, document.body) : null;
}

export default SideDrawer;
