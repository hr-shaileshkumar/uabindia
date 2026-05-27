import { useCallback, useMemo, useState } from "react";
import type { SelectableRow } from "@/features/shared/types/bulkActions";

export interface TableSelectionState<T extends SelectableRow> {
  selectedIds: Set<string>;
  selectedItems: T[];
  selectionCount: number;
  isSelected: (id: string) => boolean;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setItems: (items: T[]) => void;
}

/**
 * Generic, reusable row-selection hook.
 * Pass the current visible items array; the hook tracks selected IDs
 * and exposes helpers for select-one / select-all / clear.
 */
export function useTableSelection<T extends SelectableRow>(
  initialItems: T[] = []
): TableSelectionState<T> {
  const [items, setItemsState] = useState<T[]>(initialItems);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const setItems = useCallback((next: T[]) => {
    setItemsState(next);
    // Remove IDs that no longer exist in the new items list
    setSelectedIds((prev) => {
      const nextIds = new Set(next.map((i) => i.id));
      const pruned = new Set<string>();
      prev.forEach((id) => {
        if (nextIds.has(id)) pruned.add(id);
      });
      return pruned.size === prev.size ? prev : pruned;
    });
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map((i) => i.id)));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const selectedItems = useMemo(
    () => items.filter((i) => selectedIds.has(i.id)),
    [items, selectedIds]
  );

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected;

  return {
    selectedIds,
    selectedItems,
    selectionCount: selectedIds.size,
    isSelected,
    isAllSelected,
    isIndeterminate,
    toggleSelection,
    selectAll,
    clearSelection,
    setItems,
  };
}
