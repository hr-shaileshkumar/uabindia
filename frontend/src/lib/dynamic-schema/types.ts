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
  | "file";

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
  options?: DynamicSelectOption[];
  optionsEndpoint?: string;
  lookupValueKey?: string;
  lookupLabelKey?: string;
  dependsOn?: string; // Parent field key for cascading lookups (e.g. "stateId")
  filterParam?: string; // Query param name sent to optionsEndpoint (defaults to dependsOn)
  isCustom?: boolean;
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

export interface DynamicPageSchema {
  schemaVersion: string;
  pageKey: string;
  title: string;
  subTitle?: string;
  entityName: string;
  viewType: "table" | "cards" | "split";
  apiEndpoint: string;
  idField?: string;
  kpiMetrics?: DynamicKpiMetric[];
  columns: DynamicColumn[];
  filters: DynamicFilter[];
  form: {
    sections: DynamicFormSection[];
  };
  actions: DynamicAction[];
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
