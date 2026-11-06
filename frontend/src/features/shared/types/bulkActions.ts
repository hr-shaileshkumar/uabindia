/**
 * Shared types and config for the global bulk-action framework.
 * Each table page defines a BulkActionPageConfig to describe
 * which fields are editable and what bulk operations are allowed.
 */

export type FieldType = "text" | "number" | "select" | "boolean" | "date";

/** Defines one editable field in BulkEditDialog */
export interface BulkActionFieldConfig {
  /** The key that maps to the row object */
  key: string;
  /** Display label */
  label: string;
  fieldType: FieldType;
  /** For fieldType === "select" */
  options?: { value: string; label: string }[];
  /** Placeholder text */
  placeholder?: string;
  /** Whether this field can be bulk-edited */
  editable?: boolean;
}

/** Per-page capability config for the global action bar */
export interface BulkActionPageConfig {
  /** Editable fields available in the BulkEditDialog */
  editableFields: BulkActionFieldConfig[];
  /** Whether the page supports soft-delete */
  canSoftDelete?: boolean;
  /** Whether the page supports restore (recycle-bin pages) */
  canRestore?: boolean;
  /** Whether the page supports hard-delete (recycle-bin pages) */
  canHardDelete?: boolean;
}

/** Partial failure result from a bulk operation */
export interface BulkOperationResult {
  successCount: number;
  failureCount: number;
  failedIds: string[];
  errors: Record<string, string>;
}

/** Shape required of any row used with useTableSelection */
export interface SelectableRow {
  id: string;
}
