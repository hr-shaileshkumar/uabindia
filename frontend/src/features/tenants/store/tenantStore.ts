import { create } from "zustand";

interface TenantStore {
  selectedTenantIds: string[];
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isImportModalOpen: boolean;
  setImportModalOpen: (isOpen: boolean) => void;
}

export const useTenantStore = create<TenantStore>((set) => ({
  selectedTenantIds: [],
  toggleSelection: (id) =>
    set((state) => ({
      selectedTenantIds: state.selectedTenantIds.includes(id)
        ? state.selectedTenantIds.filter((t) => t !== id)
        : [...state.selectedTenantIds, id],
    })),
  selectAll: (ids) => set({ selectedTenantIds: ids }),
  clearSelection: () => set({ selectedTenantIds: [] }),
  isImportModalOpen: false,
  setImportModalOpen: (isOpen) => set({ isImportModalOpen: isOpen }),
}));
