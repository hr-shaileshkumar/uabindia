"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useNavigationStore } from "@/store/navigationStore";

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

export function SideDrawer({
  open,
  onClose,
  title,
  children,
  footer,
}: SideDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const isSidebarCollapsed = useNavigationStore((state) => state.isSidebarCollapsed);

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
      delete host.dataset.erpFormOpen;
    };
  }, [open, mounted]);

  if (!open || !mounted) return null;

  const host = document.getElementById(ERP_WORKSPACE_CONTENT_ID);

  const panel = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="flex h-full min-h-0 flex-col bg-slate-50 p-3 sm:p-4"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5">
          <h2 className="truncate text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer ? <div className="shrink-0 border-t border-slate-200 px-4 py-3">{footer}</div> : null}
      </div>
    </div>
  );

  if (host) {
    return createPortal(
      <div className="absolute inset-0 z-20" data-erp-form-page="true">
        {panel}
      </div>,
      host,
    );
  }

  const sidebarWidth = isSidebarCollapsed
    ? "lg:left-[var(--erp-sidebar-collapsed-width)]"
    : "lg:left-[var(--erp-sidebar-width)]";

  return (
    <div className={`fixed inset-x-0 bottom-0 top-[var(--erp-topbar-height)] z-20 ${sidebarWidth}`}>
      {panel}
    </div>
  );
}
