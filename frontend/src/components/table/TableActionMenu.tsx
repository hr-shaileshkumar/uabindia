"use client";

import { useEffect, useRef, useState } from "react";

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface TableActionMenuProps {
  items: ActionMenuItem[];
  /** Button label, defaults to "Actions" */
  label?: string;
}

/**
 * Reusable per-row dropdown action menu.
 * Positions itself to stay within the viewport.
 */
export function TableActionMenu({ items, label = "Actions" }: TableActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleOpen = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuH = 200;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < menuH ? rect.top - menuH + window.scrollY : rect.bottom + window.scrollY + 4;
    setPosition({ top, left: rect.left + window.scrollX });
    setOpen((v) => !v);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        !btnRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="erp-action-btn erp-action-btn-secondary text-xs"
      >
        {label} ▾
      </button>

      {open && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: position.top, left: position.left, zIndex: 9999 }}
          className="min-w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`block w-full px-4 py-2 text-left text-sm transition hover:bg-slate-50 disabled:opacity-40 ${
                item.danger ? "text-red-600" : "text-slate-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
