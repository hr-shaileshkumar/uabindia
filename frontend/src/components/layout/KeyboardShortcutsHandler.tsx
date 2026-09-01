"use client";

import { useEffect, useState } from "react";
import { Keyboard, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function KeyboardShortcutsHandler() {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when user is typing inside an input, textarea, or select
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInput = activeTag === "input" || activeTag === "textarea" || activeTag === "select";

      if (e.key === "?" && !isInput) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
      } else if (e.key === "Escape") {
        if (showHelp) {
          setShowHelp(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showHelp]);

  const shortcuts = [
    { key: "Ctrl + K", label: "Global Command Search" },
    { key: "/", label: "Focus Search Bar" },
    { key: "Esc", label: "Close Modal / Drawer" },
    { key: "?", label: "Show Keyboard Shortcuts" },
  ];

  return (
    <AnimatePresence>
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">ERP Keyboard Shortcuts</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {shortcuts.map((s) => (
                <div key={s.key} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{s.label}</span>
                  <kbd className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] font-semibold text-slate-700 shadow-2xs">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-3 text-center text-[11px] text-slate-400">
              Press <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px]">Esc</kbd> or click outside to dismiss
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
