/**
 * Canonical TypeScript types for the Metadata-Driven Dynamic Page Engine.
 * Supports DynamicPage, DynamicTable, DynamicForm, and No-Code Page Builder.
 */

export type DynamicFieldType =
  | "text"
  | "textarea"
  | "number"
  | "decimal"
  | "currency"
  | "percentage"
  | "date"
  | "datetime"
  | "time"
  | "boolean"
  | "checkbox"
  | "select"
  | "lookup"
  | "status"
  | "badge"
  | "phone"
  | "email"
  | "url"
  | "password"
  | "image"
  | "file"
  | "radio"
  | "multiselect"
  | "richtext"
  | "rating"
  | "formula"
  | "signature"
  | "gps"
  | "custom";

export interface DynamicConditionalRules {
  visibleWhen?: string;
  requiredWhen?: string;
  readonlyWhen?: string;
  disabledWhen?: string;
  defaultWhen?: string;
  validationWhen?: string;
}

export interface DynamicSelectOption {
  value: string;
  label: string;
}

export interface DynamicFormField {
  key: string;
  label: string;
  fieldType: DynamicFieldType;
  required?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  defaultValue?: any;
  helpText?: string;
  sortOrder?: number;
  colSpan?: 1 | 2 | 3 | 4; // Visual Drag & Drop grid column span
  options?: DynamicSelectOption[];
  optionsEndpoint?: string;
  lookupValueKey?: string;
  lookupLabelKey?: string;
  dependsOn?: string; // Parent field key for cascading lookups (e.g. "stateId")
  filterParam?: string; // Query param name sent to optionsEndpoint (defaults to dependsOn)
  isCustom?: boolean;
  conditionalRules?: DynamicConditionalRules;
  security?: {
    maskType?: "none" | "full" | "partial" | "lastFour";
    restrictedRoles?: string[];
    restrictedPermissions?: string[];
  };
  requiredPermission?: string;
  currencyCode?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    patternMessage?: string;
  };
}

export interface DynamicLineItemColumn {
  key: string;
  label: string;
  dataType: "string" | "number" | "currency" | "lookup" | "select";
  required?: boolean;
  width?: string;
  optionsEndpoint?: string;
  lookupValueKey?: string;
  lookupLabelKey?: string;
  options?: DynamicSelectOption[];
  readOnly?: boolean;
  placeholder?: string;
  formula?: string; // Formula for auto computation, e.g. "quantity * unitPrice"
  currencyCode?: string;
}

export interface DynamicLineItemSection {
  key: string; // Form data key to store items array (e.g. "items", "lines")
  title: string;
  description?: string;
  columns: DynamicLineItemColumn[];
  allowAdd?: boolean;
  allowDelete?: boolean;
  minItems?: number;
  maxItems?: number;
  totalComputedField?: string; // Form data key to update with sum of line items (e.g. "totalAmount")
}

export interface DynamicFormSection {
  title: string;
  description?: string;
  gridCols?: 1 | 2 | 3 | 4; // Visual Drag & Drop section column count (default 2)
  fields: DynamicFormField[];
  lineItems?: DynamicLineItemSection;
}

export interface DynamicColumn {
  key: string;
  label: string;
  dataType: "string" | "number" | "currency" | "date" | "datetime" | "boolean" | "badge" | "status" | "lookup";
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  sortOrder?: number;
  width?: string;
  format?: string;
  currencyCode?: string;
  security?: {
    maskType?: "none" | "full" | "partial" | "lastFour";
    restrictedRoles?: string[];
    restrictedPermissions?: string[];
  };
  requiredPermission?: string;
}

export interface DynamicFilter {
  key: string;
  label: string;
  filterType: "text" | "select" | "date" | "dateRange" | "boolean";
  placeholder?: string;
  options?: DynamicSelectOption[];
  optionsEndpoint?: string;
}

export interface DynamicAction {
  key: string;
  label: string;
  actionType: "button" | "link" | "menu";
  variant?: "primary" | "secondary" | "danger";
  icon?: string;
  href?: string;
  requiredPermission?: string;
}

export interface DynamicKpiMetric {
  label: string;
  value?: string | number;
  dataKey?: string; // Optional key in data to compute aggregate (e.g. "total", "activeCount")
  tone?: "positive" | "negative" | "warning" | "info" | "neutral";
  icon?: string;
  subtext?: string;
}

export type ErpPageFamily =
  | "information"
  | "data_entry"
  | "process"
  | "configuration"
  | "supporting";

export type ErpPageType =
  | "dashboard"
  | "list"
  | "detail"
  | "form"
  | "edit"
  | "master"
  | "transaction"
  | "workflow"
  | "calendar"
  | "kanban"
  | "report"
  | "analytics"
  | "wizard"
  | "import"
  | "search"
  | "configuration"
  | "approval"
  | "timeline"
  | "document"
  | "audit"
  | "notification"
  | "portal"
  | "exception"
  | "map"
  | "scheduler";

export interface WorkflowTransition {
  action: string;
  label: string;
  fromState: string;
  toState: string;
  variant?: "primary" | "secondary" | "success" | "danger" | "warning";
  requiredPermission?: string;
  requiresRemarks?: boolean;
}

export interface DynamicWorkflowConfig {
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

export interface LinkedEntityConfig {
  key: string;
  label: string;
  entityName: string;
  foreignKey: string;
  apiEndpoint: string;
  columns: Array<{ key: string; label: string; dataType?: string }>;
}

export interface DynamicPageSchema {
  schemaVersion: string;
  pageKey: string;
  title: string;
  subTitle?: string;
  entityName: string;
  moduleKey?: string;
  pageFamily?: ErpPageFamily;
  pageType?: ErpPageType;
  viewType: "table" | "cards" | "split" | "kanban";
  apiEndpoint: string;
  idField?: string;
  kpiMetrics?: DynamicKpiMetric[];
  columns: DynamicColumn[];
  filters: DynamicFilter[];
  form: {
    sections: DynamicFormSection[];
  };
  actions: DynamicAction[];
  layout?: {
    type?: "tabs" | "accordion" | "wizard" | "split" | "drawer" | "fullPage" | "modal";
    columns?: 1 | 2 | 3 | 4;
    density?: "compact" | "standard" | "comfortable";
  };
  workflowConfig?: DynamicWorkflowConfig;
  workflow?: DynamicWorkflowConfig;
  linkedEntities?: LinkedEntityConfig[];
  hasAttachments?: boolean;
  hasTimeline?: boolean;
}

export interface UiPageSummary {
  id: string;
  pageKey: string;
  entityName: string;
  title: string;
  subTitle?: string;
  moduleKey: string;
  viewType: string;
  routePath: string;
  icon: string;
  status: "Draft" | "Published" | "Archived";
  publishedVersion?: number;
  draftVersion?: number;
  addToNavigation: boolean;
  navGroup?: string;
  navSortOrder: number;
  requiredPermission?: string;
  createdAt: string;
  updatedAt?: string;
  versionCount: number;
}
