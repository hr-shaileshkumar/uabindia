/**
 * TypeScript types for the backend UI Shell schema endpoints.
 * These mirror UiShellDtos.cs in the backend exactly.
 *
 * All consumers should import from this file so that type changes
 * propagate automatically throughout the frontend.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Module metadata (returned by /modules/enabled and /ui-shell/navigation)
// ─────────────────────────────────────────────────────────────────────────────
export interface ModuleMetaDto {
  key: string;
  name: string;
  displayName: string;
  description?: string | null;
  icon?: string | null;
  basePath?: string | null;
  sortOrder: number;
  version: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation schema (/ui-shell/navigation)
// ─────────────────────────────────────────────────────────────────────────────
export interface NavigationSchemaDto {
  schemaVersion: string;
  modules: NavModuleDto[];
}

export interface NavModuleDto {
  key: string;
  displayName: string;
  icon?: string | null;
  homeHref?: string | null;
  sortOrder: number;
  groups: NavGroupDto[];
}

export interface NavGroupDto {
  label: string;
  sortOrder: number;
  items: NavItemDto[];
}

export interface NavItemDto {
  key: string;
  name: string;
  path: string;
  icon?: string | null;
  sortOrder: number;
  requiredPermissions: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Route rules (/ui-shell/route-rules)
// ─────────────────────────────────────────────────────────────────────────────
export interface RouteRulesDto {
  schemaVersion: string;
  rules: RoutePermissionRuleDto[];
}

export interface RoutePermissionRuleDto {
  pathPattern: string;
  moduleKey: string;
  permissionKeys: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard schema (/ui-shell/dashboard)
// ─────────────────────────────────────────────────────────────────────────────
export interface DashboardSchemaDto {
  schemaVersion: string;
  sections: DashboardSectionDto[];
}

export interface DashboardSectionDto {
  key: string;
  title: string;
  sortOrder: number;
  widgets: WidgetDto[];
}

export interface WidgetDto {
  key: string;
  type: "card" | "stat" | "chart" | "list" | "custom";
  title: string;
  icon?: string | null;
  href?: string | null;
  dataEndpoint?: string | null;
  moduleKey?: string | null;
  sortOrder: number;
  requiredPermissions: string[];
  props: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page schema (/ui-shell/page-schema/{pageKey})
// ─────────────────────────────────────────────────────────────────────────────
export interface PageSchemaDto {
  schemaVersion: string;
  pageKey: string;
  title: string;
  subTitle?: string | null;
  layout: "crud" | "tabs" | "custom";
  handlerKey?: string | null;
  table?: TableSchemaDto | null;
  form?: FormSchemaDto | null;
  tabs: TabDefDto[];
  actions: ActionDefDto[];
}

export interface TableSchemaDto {
  apiEndpoint: string;
  columns: TableColumnDto[];
  filters: FilterDefDto[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface TableColumnDto {
  key: string;
  label: string;
  dataType: "string" | "number" | "date" | "boolean" | "badge" | "currency";
  sortable: boolean;
  hidden: boolean;
  sortOrder: number;
  format?: string | null;
}

export interface FormSchemaDto {
  apiEndpoint: string;
  fields: FieldDefDto[];
}

export interface FieldDefDto {
  key: string;
  label: string;
  fieldType: "text" | "number" | "select" | "date" | "textarea" | "checkbox" | "email" | "phone";
  required: boolean;
  readOnly: boolean;
  sortOrder: number;
  placeholder?: string | null;
  defaultValue?: string | null;
  optionsEndpoint?: string | null;
  options: SelectOptionDto[];
  validation: Record<string, string>;
}

export interface SelectOptionDto {
  value: string;
  label: string;
}

export interface TabDefDto {
  key: string;
  label: string;
  sortOrder: number;
  contentSchemaKey?: string | null;
  requiredPermissions: string[];
}

export interface FilterDefDto {
  key: string;
  label: string;
  filterType: "text" | "select" | "date" | "boolean";
  optionsEndpoint?: string | null;
  options: SelectOptionDto[];
}

export interface ActionDefDto {
  key: string;
  label: string;
  actionType: "button" | "link" | "menu";
  variant: "primary" | "secondary" | "danger";
  icon?: string | null;
  href?: string | null;
  handlerKey?: string | null;
  requiredPermissions: string[];
}
