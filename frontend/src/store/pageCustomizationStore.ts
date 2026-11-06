import { create } from "zustand";
import { persist } from "zustand/middleware";
import { viewDefinitionsApi, type ApiViewDefinition, type RowDensity, type ColumnSetting } from "@/services/modules/viewDefinitionsApi";

// ─── Types ───────────────────────────────────────────────────────────────────

export type { ColumnSetting, RowDensity };

export interface SavedView {
  id: string;
  name: string;
  scope?: "Personal" | "Role" | "Tenant";
  targetRole?: string | null;
  filters: Record<string, any>;
  columns: ColumnSetting[];
  sortKey: string;
  sortDir: "asc" | "desc";
  groupBy?: string;
  density?: RowDensity;
  isDefault?: boolean;
  createdAt: string;
}

export interface PageCustomization {
  columns: ColumnSetting[];
  savedViews: SavedView[];
  activeViewId: string | null;
  density: RowDensity;
  sortKey: string;
  sortDir: "asc" | "desc";
  groupBy: string;
  activeFilters: Record<string, any>;
  isSyncing?: boolean;
}

interface PageCustomizationStore {
  pages: Record<string, PageCustomization>;
  setColumnSettings: (pageKey: string, columns: ColumnSetting[]) => void;
  toggleColumnVisibility: (pageKey: string, colKey: string) => void;
  reorderColumns: (pageKey: string, columns: ColumnSetting[]) => void;
  setColumnWidth: (pageKey: string, colKey: string, width: number) => void;
  setDensity: (pageKey: string, density: RowDensity) => void;
  setSort: (pageKey: string, sortKey: string, sortDir: "asc" | "desc") => void;
  setGroupBy: (pageKey: string, groupBy: string) => void;
  setActiveFilters: (pageKey: string, filters: Record<string, any>) => void;
  clearFilters: (pageKey: string) => void;
  saveView: (pageKey: string, name: string, scope?: "Personal" | "Role" | "Tenant", targetRole?: string | null) => Promise<SavedView>;
  deleteView: (pageKey: string, viewId: string) => Promise<void>;
  activateView: (pageKey: string, viewId: string) => void;
  setDefaultView: (pageKey: string, viewId: string) => Promise<void>;
  syncViewsFromServer: (pageKey: string) => Promise<void>;
  initializePage: (pageKey: string, defaultColumns: ColumnSetting[]) => void;
  getPage: (pageKey: string) => PageCustomization | undefined;
}

const DEFAULT_PAGE: PageCustomization = {
  columns: [],
  savedViews: [],
  activeViewId: null,
  density: "normal",
  sortKey: "",
  sortDir: "asc",
  groupBy: "",
  activeFilters: {},
  isSyncing: false,
};

export const usePageCustomizationStore = create<PageCustomizationStore>()(
  persist(
    (set, get) => ({
      pages: {},

      getPage: (pageKey) => get().pages[pageKey],

      initializePage: (pageKey, defaultColumns) => {
        const existing = get().pages[pageKey];
        if (!existing || existing.columns.length === 0) {
          set((state) => ({
            pages: {
              ...state.pages,
              [pageKey]: { ...DEFAULT_PAGE, columns: defaultColumns },
            },
          }));
        }
      },

      setColumnSettings: (pageKey, columns) =>
        set((state) => ({
          pages: { ...state.pages, [pageKey]: { ...(state.pages[pageKey] || DEFAULT_PAGE), columns } },
        })),

      toggleColumnVisibility: (pageKey, colKey) =>
        set((state) => {
          const page = state.pages[pageKey] || DEFAULT_PAGE;
          return {
            pages: {
              ...state.pages,
              [pageKey]: {
                ...page,
                columns: page.columns.map((c) => (c.key === colKey ? { ...c, visible: !c.visible } : c)),
              },
            },
          };
        }),

      reorderColumns: (pageKey, columns) =>
        set((state) => ({
          pages: { ...state.pages, [pageKey]: { ...(state.pages[pageKey] || DEFAULT_PAGE), columns } },
        })),

      setColumnWidth: (pageKey, colKey, width) =>
        set((state) => {
          const page = state.pages[pageKey] || DEFAULT_PAGE;
          return {
            pages: {
              ...state.pages,
              [pageKey]: {
                ...page,
                columns: page.columns.map((c) => (c.key === colKey ? { ...c, width } : c)),
              },
            },
          };
        }),

      setDensity: (pageKey, density) =>
        set((state) => ({
          pages: { ...state.pages, [pageKey]: { ...(state.pages[pageKey] || DEFAULT_PAGE), density } },
        })),

      setSort: (pageKey, sortKey, sortDir) =>
        set((state) => ({
          pages: { ...state.pages, [pageKey]: { ...(state.pages[pageKey] || DEFAULT_PAGE), sortKey, sortDir } },
        })),

      setGroupBy: (pageKey, groupBy) =>
        set((state) => ({
          pages: { ...state.pages, [pageKey]: { ...(state.pages[pageKey] || DEFAULT_PAGE), groupBy } },
        })),

      setActiveFilters: (pageKey, filters) =>
        set((state) => ({
          pages: {
            ...state.pages,
            [pageKey]: { ...(state.pages[pageKey] || DEFAULT_PAGE), activeFilters: filters },
          },
        })),

      clearFilters: (pageKey) =>
        set((state) => ({
          pages: {
            ...state.pages,
            [pageKey]: { ...(state.pages[pageKey] || DEFAULT_PAGE), activeFilters: {} },
          },
        })),

      syncViewsFromServer: async (pageKey: string) => {
        try {
          const remoteViews = await viewDefinitionsApi.getViews(pageKey);
          if (!remoteViews || remoteViews.length === 0) return;

          const mapped: SavedView[] = remoteViews.map((rv: ApiViewDefinition) => ({
            id: rv.id,
            name: rv.name,
            scope: rv.scope,
            targetRole: rv.targetRole,
            filters: rv.filters || {},
            columns: rv.columns || [],
            sortKey: rv.sortKey || "",
            sortDir: rv.sortDir || "asc",
            groupBy: rv.groupBy || "",
            density: rv.density || "normal",
            isDefault: rv.isDefault,
            createdAt: rv.createdAt,
          }));

          set((state) => {
            const page = state.pages[pageKey] || DEFAULT_PAGE;
            return {
              pages: {
                ...state.pages,
                [pageKey]: {
                  ...page,
                  savedViews: mapped,
                  // If no active view is set and there's a default view, auto-activate it
                  activeViewId: page.activeViewId || mapped.find((v) => v.isDefault)?.id || null,
                },
              },
            };
          });
        } catch (err) {
          console.warn(`[pageCustomizationStore] Failed to sync views for ${pageKey}:`, err);
        }
      },

      saveView: async (pageKey, name, scope = "Personal", targetRole = null) => {
        const page = get().pages[pageKey] || DEFAULT_PAGE;
        const tempId = `view_${Date.now()}`;
        const newView: SavedView = {
          id: tempId,
          name,
          scope,
          targetRole,
          filters: { ...page.activeFilters },
          columns: [...page.columns],
          sortKey: page.sortKey,
          sortDir: page.sortDir,
          groupBy: page.groupBy,
          density: page.density,
          isDefault: false,
          createdAt: new Date().toISOString(),
        };

        // 1. Optimistic update
        set((state) => ({
          pages: {
            ...state.pages,
            [pageKey]: { ...page, savedViews: [...page.savedViews, newView], activeViewId: tempId },
          },
        }));

        // 2. Persist to backend database
        try {
          const serverCreated = await viewDefinitionsApi.createView({
            pageKey,
            name,
            scope,
            targetRole,
            filters: newView.filters,
            columns: newView.columns,
            sortKey: newView.sortKey,
            sortDir: newView.sortDir,
            groupBy: newView.groupBy,
            density: newView.density,
            isDefault: false,
          });

          // 3. Reconcile with server ID
          if (serverCreated?.id) {
            set((state) => {
              const currentPage = state.pages[pageKey] || DEFAULT_PAGE;
              return {
                pages: {
                  ...state.pages,
                  [pageKey]: {
                    ...currentPage,
                    savedViews: currentPage.savedViews.map((v) =>
                      v.id === tempId ? { ...v, id: serverCreated.id } : v
                    ),
                    activeViewId:
                      currentPage.activeViewId === tempId ? serverCreated.id : currentPage.activeViewId,
                  },
                },
              };
            });
            return { ...newView, id: serverCreated.id };
          }
        } catch (err) {
          console.warn("[pageCustomizationStore] Server view persistence failed, keeping local fallback:", err);
        }

        return newView;
      },

      deleteView: async (pageKey, viewId) => {
        // 1. Optimistic removal
        set((state) => {
          const page = state.pages[pageKey] || DEFAULT_PAGE;
          return {
            pages: {
              ...state.pages,
              [pageKey]: {
                ...page,
                savedViews: page.savedViews.filter((v) => v.id !== viewId),
                activeViewId: page.activeViewId === viewId ? null : page.activeViewId,
              },
            },
          };
        });

        // 2. Backend deletion if it's a GUID
        if (!viewId.startsWith("view_")) {
          try {
            await viewDefinitionsApi.deleteView(viewId);
          } catch (err) {
            console.warn(`[pageCustomizationStore] Failed to delete view ${viewId} on server:`, err);
          }
        }
      },

      activateView: (pageKey, viewId) =>
        set((state) => {
          const page = state.pages[pageKey] || DEFAULT_PAGE;
          const view = page.savedViews.find((v) => v.id === viewId);
          if (!view) return state;
          return {
            pages: {
              ...state.pages,
              [pageKey]: {
                ...page,
                activeViewId: viewId,
                activeFilters: { ...view.filters },
                columns: view.columns && view.columns.length > 0 ? [...view.columns] : page.columns,
                sortKey: view.sortKey || page.sortKey,
                sortDir: view.sortDir || page.sortDir,
                groupBy: view.groupBy || "",
                density: view.density || page.density,
              },
            },
          };
        }),

      setDefaultView: async (pageKey, viewId) => {
        set((state) => {
          const page = state.pages[pageKey] || DEFAULT_PAGE;
          return {
            pages: {
              ...state.pages,
              [pageKey]: {
                ...page,
                savedViews: page.savedViews.map((v) => ({ ...v, isDefault: v.id === viewId })),
              },
            },
          };
        });

        if (!viewId.startsWith("view_")) {
          try {
            await viewDefinitionsApi.setDefaultView(viewId);
          } catch (err) {
            console.warn(`[pageCustomizationStore] Failed to set default view ${viewId} on server:`, err);
          }
        }
      },
    }),
    { name: "erp-page-customization", version: 2 }
  )
);
