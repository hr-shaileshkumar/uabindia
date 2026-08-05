"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
  side?: "right" | "left";
}

const widthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function SideDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = "md",
  side = "right",
}: SideDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const initial = side === "right" ? { x: "100%" } : { x: "-100%" };
  const animate = { x: 0 };
  const exit = initial;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={initial}
            animate={animate}
            exit={exit}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={cn(
              "fixed inset-y-0 z-50 flex flex-col bg-background shadow-2xl border-border",
              side === "right" ? "right-0 border-l" : "left-0 border-r",
              "w-full",
              widthMap[width]
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5 shrink-0">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground truncate">{title}</h2>
                {subtitle && <p className="mt-0.5 text-sm text-muted-foreground truncate">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                aria-label="Close drawer"
                className="shrink-0 flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="shrink-0 border-t border-border px-6 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
