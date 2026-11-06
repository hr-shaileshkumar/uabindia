"use client";

import { useCallback, useEffect, useId, useRef, useState, type MouseEvent } from "react";

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
  const menuId = useId();
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!btnRef.current) return;

    const rect = btnRef.current.getBoundingClientRect();
    const menuWidth = 176;
    const menuHeight = 200;
    const viewportPadding = 12;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < menuHeight
      ? Math.max(viewportPadding, rect.top - menuHeight - 4)
      : Math.min(window.innerHeight - menuHeight - viewportPadding, rect.bottom + 4);
    const left = Math.min(
      Math.max(viewportPadding, rect.left),
      window.innerWidth - menuWidth - viewportPadding
    );

    setPosition({ top, left });
  }, []);

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    calculatePosition();
    setOpen((v) => !v);
  };

  // Close on outside click / pointer down
  useEffect(() => {
    if (!open) return;
    const handler = (e: PointerEvent) => {
      if (
        !btnRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleViewportChange = () => setOpen(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handler);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handler);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        onPointerDown={(event) => event.stopPropagation()}
        className="erp-action-btn erp-action-btn-secondary text-xs"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
      >
        {label} ▾
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          style={{ position: "fixed", top: position.top, left: position.left, zIndex: 9999 }}
          className="min-w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
          onPointerDown={(event) => event.stopPropagation()}
        >
          {items.map((item, index) => (
            <button
              key={`${item.label}-${index}`}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
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
