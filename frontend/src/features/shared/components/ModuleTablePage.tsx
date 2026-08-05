import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { StatusBadge } from "@/components/erp/status-badge";
import { CrudCard } from "@/components/erp/crud-workspace";

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
  headerStats?: ReactNode;
  intro?: ReactNode;
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
  headerStats,
  intro,
  kpiCards,
  detailCard,
  quickEditDrawer,
}: ModuleTablePageProps<T>) {
  const displayError = loadError ?? error;
  const recordCount = rows.length;
  const recordCountText = loading ? "Loading..." : countLabel ? countLabel(recordCount) : `${recordCount} records`;
  const shellTone = displayError ? "critical" : loading ? "warning" : recordCount > 0 ? "positive" : "info";

  return (
    <StandardPageLayout
      title={title}
      subtitle={subtitle}
      eyebrow={eyebrow}
      icon={icon}
      meta={
        <>
          <StatusBadge tone={shellTone}>
            {displayError ? "Needs attention" : loading ? "Refreshing" : recordCount > 0 ? "Operational" : "No records"}
          </StatusBadge>
          {headerStats ?? (
            <span className="rounded-full border border-[#d9e6ff] bg-[#eef4ff] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2152d8]">
              {recordCountText}
            </span>
          )}
        </>
      }
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
      {intro ? <div className="mb-4">{intro}</div> : null}
      {kpiCards && !headerStats ? <div className="mb-4">{kpiCards}</div> : null}

      <CrudCard
        title={toolbarTitle}
        description={toolbarSubtitle}
        badge={<span className="erp-toolbar-badge">{recordCountText}</span>}
      >
        <div className="erp-table-wrap rounded-none border-0 shadow-none">
          {loading && rows.length === 0 ? (
            <div className="space-y-2 p-3" role="status" aria-live="polite">
              <span className="sr-only">Loading the latest records</span>
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="grid animate-pulse grid-cols-[minmax(8rem,1.5fr)_repeat(3,minmax(6rem,1fr))] gap-3 border-b border-slate-100 py-2.5" aria-hidden="true">
                  <span className="h-3 rounded bg-slate-200" />
                  <span className="h-3 rounded bg-slate-100" />
                  <span className="h-3 rounded bg-slate-100" />
                  <span className="h-3 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : (
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
                    <td colSpan={columns.length} className="erp-td py-10 text-center">
                      <div className="mx-auto flex max-w-xl flex-col items-center gap-2 text-center" role="status">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500" aria-hidden="true">
                          <Inbox className="h-4 w-4" />
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Empty view
                        </span>
                        <p className="text-sm font-semibold text-slate-900">No records in the current view</p>
                        <p className="text-sm leading-6 text-slate-500">{emptyMessage}</p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
      </CrudCard>

      {detailCard ? <div className="mt-4">{detailCard}</div> : null}
      {quickEditDrawer ?? null}
    </StandardPageLayout>
  );
}
