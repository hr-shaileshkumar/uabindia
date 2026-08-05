import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
}

interface NavigationStore {
  favorites: NavItem[];
  recent: NavItem[];
  addFavorite: (item: NavItem) => void;
  removeFavorite: (id: string) => void;
  addRecent: (item: NavItem) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

export const useNavigationStore = create<NavigationStore>()(
  persist(
    (set) => ({
      favorites: [],
      recent: [],
      isSidebarCollapsed: false,
      isSearchOpen: false,
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
      setSearchOpen: (open) => set({ isSearchOpen: open }),
      addFavorite: (item) =>
        set((state) => ({
          favorites: state.favorites.some((f) => f.id === item.id)
            ? state.favorites
            : [...state.favorites, item],
        })),
      removeFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        })),
      addRecent: (item) =>
        set((state) => {
          const filtered = state.recent.filter((r) => r.id !== item.id);
          return {
            recent: [item, ...filtered].slice(0, 10), // keep only last 10
          };
        }),
    }),
    {
      name: "erp-navigation-storage",
    }
  )
);
