import type { ReactNode } from "react";
import type {
  ErpListBulkAction,
  ErpListColumn,
} from "@/lib/workspace/list-view";
import type { ImportColumnDefinition } from "@/components/workspace/BulkImportModal";

export type ColumnInput = ErpListColumn | { label: string; className?: string; key?: string };

export type ErpListViewProps<T> = {
  listKey: string;
  rows: T[];
  columns: ColumnInput[];
  renderRow: (row: T) => ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  getRowId?: (row: T) => string;
  extraFilters?: ReactNode;
  onCreate?: () => void;
  createLabel?: string;
  onRefresh?: () => void;
  onBulkDelete?: (rows: T[]) => void;
  bulkActions?: ErpListBulkAction[];
  searchPlaceholder?: string;
  onBulkImport?: (rows: Record<string, unknown>[]) => Promise<void>;
  importColumns?: ImportColumnDefinition[];
  onRowClick?: (row: T) => void;
};

export type {
  ErpListBulkAction,
  ErpListColumn,
  ErpListFilterRule,
} from "@/lib/workspace/list-view";
