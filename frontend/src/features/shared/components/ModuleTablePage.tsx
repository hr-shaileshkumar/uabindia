import type { ReactNode } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";

export type ModuleTableColumn = {
  label: string;
  className?: string;
};

type ModuleTablePageProps<T> = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  icon?: string;
  toolbarTitle: string;
  toolbarSubtitle: string;
  loading: boolean;
  error?: string | null;
  /** Alias for error — used when wiring live API data */
  loadError?: string | null;
  /** Retry callback shown next to loadError message */
  onRetry?: () => void;
  rows: T[];
  columns: ModuleTableColumn[];
  renderRow: (row: T) => ReactNode;
  emptyMessage: string;
  countLabel?: (count: number) => string;
  actions?: ReactNode;
  filters?: ReactNode;
  pagination?: ReactNode;
  kpiCards?: ReactNode;
  detailCard?: ReactNode;
  quickEditDrawer?: ReactNode;
};

export default function ModuleTablePage<T>({
  title,
  subtitle,
  eyebrow,
  icon,
  toolbarTitle,
  toolbarSubtitle,
  loading,
  error,
  loadError,
  onRetry,
  rows,
  columns,
  renderRow,
  emptyMessage,
  countLabel,
  actions,
  filters,
  pagination,
  kpiCards,
  detailCard,
  quickEditDrawer,
}: ModuleTablePageProps<T>) {
  const displayError = loadError ?? error;
  return (
    <StandardPageLayout
      title={title}
      subtitle={subtitle}
      eyebrow={eyebrow}
      icon={icon}
      actions={actions}
      filters={filters}
      pagination={pagination}
    >
      {displayError ? (
        <div className="erp-alert-error flex items-center justify-between gap-4">
          <span>{displayError}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="shrink-0 rounded border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              Retry
            </button>
          )}
        </div>
      ) : null}
      {kpiCards ? <div className="mb-4">{kpiCards}</div> : null}

      <div className="erp-panel">
        <div className="erp-table-toolbar">
          <div>
            <div className="erp-table-title">{toolbarTitle}</div>
            <div className="erp-table-subtitle">{toolbarSubtitle}</div>
          </div>
          <span className="erp-toolbar-badge">
            {loading ? "Loading..." : countLabel ? countLabel(rows.length) : `${rows.length} records`}
          </span>
        </div>
        <div className="erp-table-wrap rounded-none border-0 shadow-none">
          <table className="erp-table">
            <thead className="erp-thead">
              <tr>
                {columns.map((column) => (
                  <th key={column.label} className={`erp-th ${column.className ?? ""}`.trim()}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => renderRow(row))}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="erp-td py-8 text-center text-slate-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {detailCard ? <div className="mt-4">{detailCard}</div> : null}
      {quickEditDrawer ?? null}
    </StandardPageLayout>
  );
}
