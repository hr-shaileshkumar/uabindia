/**
 * Workspace Core Library & Infrastructure
 * 
 * Central domain-agnostic navigation, routing, permissions, and module registry utilities.
 */

// Module Registry & Definitions
export {
  listModuleRegistry,
  listSidebarVisibleModuleRegistry,
  getModuleDefinition,
  getModuleLabel,
  getModuleIcon,
  getModuleDescription,
} from "./module-registry";

export type { ModuleDefinition } from "./module-registry";

// Navigation & Sidebar Module Builder
export {
  buildWorkspaceModules,
  buildFallbackWorkspaceModules,
  groupWorkspaceModulesForSidebar,
  findWorkspaceModuleByPath,
  findWorkspaceModuleByKey,
  findWorkspacePageByPath,
  filterWorkspaceModules,
  flattenWorkspacePages,
} from "./navigation";

export type {
  WorkspaceModule,
  WorkspaceNavGroup,
  WorkspaceNavItem,
  WorkspacePageMatch,
  SidebarNavSection,
} from "./navigation";

// Route Configuration & Canonical Path Helpers
export {
  canonicalizeProtectedPath,
  matchesAnyPrefix,
  AUTH_PATH_PREFIXES,
  BUSINESS_PATH_PREFIXES,
  OWNER_PATH_PREFIXES,
} from "./route-config";

// Route Permissions & Security Matcher
export {
  getSchemaRouteRule,
  getSchemaRoutePermissionKeys,
  getEffectiveRoutePermissionKeys,
} from "./route-access";

// Portal Theming
export {
  getPortalTheme,
} from "./portals";

export type { PortalTheme, PortalId } from "./portals";

// Global Jurisdictions & Localization
export {
  GLOBAL_JURISDICTIONS,
  getCountryJurisdiction,
} from "./jurisdictions";

// List View Utilities
export {
  loadListPreferences,
  saveListPreferences,
  exportListCsv,
  formatListCell,
  applyListFilters,
} from "./list-view";

export type {
  ErpListColumn as WorkspaceListColumn,
  ErpListFilterRule as WorkspaceListFilterRule,
  ErpListBulkAction as WorkspaceListBulkAction,
} from "./list-view";
