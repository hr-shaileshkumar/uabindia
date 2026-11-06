/**
 * Core Metadata Type Definitions for UAB India Enterprise Workspace Engine
 */

export type ViewType = "table" | "form" | "split" | "kanban" | "dashboard" | "calendar";

export type PageArchetype =
  | "master"
  | "dashboard"
  | "document"
  | "kanban"
  | "calendar"
  | "studio";

export type FieldDataType =
  | "text"
  | "number"
  | "currency"
  | "date"
  | "datetime"
  | "boolean"
  | "select"
  | "lookup"
  | "status"
  | "badge"
  | "avatar"
  | "email"
  | "tel"
  | "url"
  | "textarea"
  | "rich-text"
  | "file"
  | "progress"
  | "password";

export interface ColumnDefinition {
  key: string;
  label: string;
  type?: FieldDataType;
  sortable?: boolean;
  defaultVisible?: boolean;
  width?: number | string;
  badgeMap?: Record<string, string> | string;
  render?: (row: any) => React.ReactNode;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface FilterDefinition {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "boolean";
  options?: SelectOption[];
  placeholder?: string;
}

export interface FormFieldDefinition {
  key: string;
  label: string;
  type: FieldDataType;
  required?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  helpText?: string;
  span?: number; // 1 to 4 columns
  options?: SelectOption[];
  lookupEndpoint?: string;
  lookupValueKey?: string;
  lookupLabelKey?: string;
  defaultValue?: any;
  validationPattern?: string;
  validationMessage?: string;
}

export interface FormSectionDefinition {
  key: string;
  label: string;
  description?: string;
  fields: FormFieldDefinition[];
}

export interface FormDefinition {
  sections: FormSectionDefinition[];
}

export interface ActionDefinition {
  key: string;
  id?: string;
  label: string;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success" | "warning";
  icon?: string;
  requiredPermission?: string;
  endpoint?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
}

export interface KpiMetricDefinition {
  key: string;
  label: string;
  icon?: string;
  color?: "indigo" | "green" | "amber" | "red" | "blue" | "purple";
  value?: string | number;
  subtext?: string;
}

export type UabPageFamily =
  | "information"
  | "data_entry"
  | "process"
  | "configuration"
  | "supporting";

export type ErpPageFamily = UabPageFamily;

export type UabPageType =
  | "dashboard" | "list" | "detail" | "form" | "edit"
  | "master" | "transaction" | "workflow" | "calendar"
  | "kanban" | "report" | "analytics" | "wizard" | "import"
  | "search" | "configuration" | "approval" | "timeline"
  | "document" | "audit" | "notification" | "portal"
  | "exception" | "map" | "scheduler";

export type ErpPageType = UabPageType;

export interface WorkflowTransition {
  action: string;
  label: string;
  fromState: string;
  toState: string;
  variant?: "primary" | "secondary" | "success" | "danger" | "warning";
  requiredPermission?: string;
  requiresRemarks?: boolean;
}

export interface WorkflowConfig {
  enabled: boolean;
  stateField?: string;
  initialState?: string;
  states: Array<{
    name: string;
    label: string;
    tone?: "positive" | "warning" | "negative" | "info" | "neutral";
    isFinal?: boolean;
  }>;
  transitions: WorkflowTransition[];
}

export interface PageSchema {
  schemaVersion?: string;
  pageKey: string;
  title: string;
  subTitle?: string;
  entityName: string;
  moduleKey: string;
  pageFamily?: ErpPageFamily;
  pageType?: ErpPageType;
  archetype?: PageArchetype;
  viewType: ViewType;
  apiEndpoint: string;
  idField?: string;
  icon?: string;
  requiredPermission?: string;
  columns?: ColumnDefinition[];
  filters?: FilterDefinition[];
  form?: FormDefinition;
  actions?: ActionDefinition[];
  kpis?: KpiMetricDefinition[];
  workflowConfig?: WorkflowConfig;
  hasTimeline?: boolean;
  hasAttachments?: boolean;
}

export interface NavigationItem {
  id: string;
  title: string;
  path: string;
  icon?: string;
  badge?: string | number;
  requiredPermission?: string;
}

export interface NavigationGroup {
  id: string;
  title: string;
  icon?: string;
  items: NavigationItem[];
}

export interface NavigationModule {
  key: string;
  name: string;
  icon: string;
  description?: string;
  groups: NavigationGroup[];
}

export interface DashboardWidget {
  id: string;
  type: "metric" | "chart" | "table" | "quick-action";
  title: string;
  span?: number;
  config: Record<string, any>;
}
