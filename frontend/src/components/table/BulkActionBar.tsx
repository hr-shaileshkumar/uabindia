"use client";

interface BulkActionBarProps {
  selectionCount: number;
  onEdit?: () => void;
  onRefresh?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  onHardDelete?: () => void;
  onClear: () => void;
  /** Show restore + hard delete instead of soft delete (recycle-bin pages) */
  recycleBinMode?: boolean;
  loading?: boolean;
}

/**
 * Slide-in action bar that appears when rows are selected.
 * Renders different buttons depending on page context.
 */
export function BulkActionBar({
  selectionCount,
  onEdit,
  onRefresh,
  onDelete,
  onRestore,
  onHardDelete,
  onClear,
  recycleBinMode = false,
  loading = false,
}: BulkActionBarProps) {
  if (selectionCount === 0) return null;

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-md">
      <span className="text-sm font-semibold text-blue-800">
        {selectionCount} selected
      </span>

      <div className="flex flex-wrap items-center gap-2">
        {onEdit && (
          <button
            type="button"
            disabled={loading}
            onClick={onEdit}
            className="erp-action-btn erp-action-btn-primary text-xs"
          >
            Edit Fields
          </button>
        )}

        {onRefresh && (
          <button
            type="button"
            disabled={loading}
            onClick={onRefresh}
            className="erp-action-btn erp-action-btn-secondary text-xs"
          >
            Refresh
          </button>
        )}

        {!recycleBinMode && onDelete && (
          <button
            type="button"
            disabled={loading}
            onClick={onDelete}
            className="erp-action-btn erp-action-btn-danger text-xs"
          >
            Delete
          </button>
        )}

        {recycleBinMode && onRestore && (
          <button
            type="button"
            disabled={loading}
            onClick={onRestore}
            className="rounded-lg border border-green-300 bg-white px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50"
          >
            Restore
          </button>
        )}

        {recycleBinMode && onHardDelete && (
          <button
            type="button"
            disabled={loading}
            onClick={onHardDelete}
            className="erp-action-btn erp-action-btn-danger text-xs"
          >
            Permanently Delete
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onClear}
        className="ml-auto text-xs text-slate-500 hover:text-slate-700"
      >
        ✕ Clear
      </button>
    </div>
  );
}
