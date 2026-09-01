"use client";

import { useEffect, useState, useCallback } from "react";

export type TableKeyboardNavOptions<T> = {
  rows: T[];
  onRowClick?: (row: T, index: number) => void;
  onToggleSelect?: (row: T, index: number) => void;
  enabled?: boolean;
};

export function useTableKeyboardNav<T>({
  rows,
  onRowClick,
  onToggleSelect,
  enabled = true,
}: TableKeyboardNavOptions<T>) {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled || rows.length === 0) return;

      // Ignore when user is actively typing inside an input, textarea, or select
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
        return;
      }

      if (e.key === "ArrowDown" || (e.key === "j" && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault();
        setFocusedIndex((prev) => (prev < rows.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp" || (e.key === "k" && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter" && focusedIndex >= 0 && focusedIndex < rows.length) {
        e.preventDefault();
        onRowClick?.(rows[focusedIndex], focusedIndex);
      } else if (e.key === " " && focusedIndex >= 0 && focusedIndex < rows.length) {
        e.preventDefault();
        onToggleSelect?.(rows[focusedIndex], focusedIndex);
      } else if (e.key === "Escape") {
        setFocusedIndex(-1);
      }
    },
    [enabled, rows, focusedIndex, onRowClick, onToggleSelect]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    focusedIndex,
    setFocusedIndex,
  };
}
