"use client";

import type { ReactNode } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import { ErpRefreshButton, ErpSearchFilter, ErpApproveRejectButtons } from "@/components/erp/erp-page-kit";
import { SideDrawer } from "@/components/ui/side-drawer";
import { erpButtonClassName } from "@/components/erp/erpStyles";

export type WorkflowQueueItem = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  status?: string;
  date?: string | null;
  canDecide?: boolean;
};

type WorkflowQueuePageProps = {
  title: string;
  icon?: string;
  loading?: boolean;
  error?: string | null;
  items: WorkflowQueueItem[];
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  stats?: Array<{ label: string; value: string | number; tone?: "info" | "positive" | "warning" | "neutral" | "danger" }>;
  statusFilter?: ReactNode;
  selected?: WorkflowQueueItem | null;
  onSelect: (item: WorkflowQueueItem | null) => void;
  drawerTitle?: string;
  drawerBody?: ReactNode;
  comments?: string;
  onCommentsChange?: (value: string) => void;
  deciding?: boolean;
  onApprove?: (item: WorkflowQueueItem) => void;
  onReject?: (item: WorkflowQueueItem) => void;
  emptyMessage?: string;
  headerActions?: ReactNode;
};

/**
 * Workflow queue contract: list + Approve/Reject in row or drawer.
 * No generic New unless the parent page adds `headerActions`.
 */
export default function WorkflowQueuePage({
  title,
  icon = "git-branch",
  loading,
  error,
  items,
  search,
  onSearchChange,
  onRefresh,
  stats,
  statusFilter,
  selected,
  onSelect,
  drawerTitle,
  drawerBody,
  comments,
  onCommentsChange,
  deciding,
  onApprove,
  onReject,
  emptyMessage = "No pending items.",
  headerActions,
}: WorkflowQueuePageProps) {
  return (
    <StandardPageLayout
      title={title}
      icon={icon}
      meta={stats ? <CrudHeaderStats items={stats} /> : undefined}
      actions={
        <>
          <ErpRefreshButton onClick={onRefresh} loading={loading} />
          {headerActions}
        </>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <ErpSearchFilter value={search} onChange={onSearchChange} placeholder="Filter queue…" />
          {statusFilter}
        </div>
      }
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <CrudCard>
        <div className="erp-table-wrap">
          <table className="erp-table table-auto">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th">Item</th>
                <th className="erp-th">Status</th>
                <th className="erp-th">Date</th>
                <th className="erp-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="erp-td py-8 text-center text-xs text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="erp-td py-8 text-center text-xs text-slate-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="erp-tr">
                    <td className="erp-td">
                      <button type="button" className="text-left" onClick={() => onSelect(item)}>
                        <div className="erp-row-title">{item.title}</div>
                        {item.subtitle ? <div className="text-xs text-slate-500">{item.subtitle}</div> : null}
                        {item.meta ? <div className="mt-0.5 text-[11px] text-slate-400">{item.meta}</div> : null}
                      </button>
                    </td>
                    <td className="erp-td">
                      <span className="erp-chip">{item.status ?? "Pending"}</span>
                    </td>
                    <td className="erp-td text-xs text-slate-500">
                      {item.date ? new Date(item.date).toLocaleString("en-IN") : "—"}
                    </td>
                    <td className="erp-td">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className={erpButtonClassName.secondary}
                          onClick={() => onSelect(item)}
                        >
                          View
                        </button>
                        {item.canDecide !== false && onApprove && onReject ? (
                          <ErpApproveRejectButtons
                            onApprove={() => onApprove(item)}
                            onReject={() => onReject(item)}
                            disabled={deciding}
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CrudCard>

      <SideDrawer
        open={Boolean(selected)}
        onClose={() => onSelect(null)}
        title={drawerTitle || selected?.title || "Request"}
        footer={
          selected && onApprove && onReject && selected.canDecide !== false ? (
            <div className="flex w-full items-center justify-between gap-3">
              {onCommentsChange ? (
                <input
                  className="erp-input flex-1"
                  placeholder="Comments (optional)"
                  value={comments ?? ""}
                  onChange={(e) => onCommentsChange(e.target.value)}
                />
              ) : (
                <span />
              )}
              <ErpApproveRejectButtons
                onApprove={() => onApprove(selected)}
                onReject={() => onReject(selected)}
                disabled={deciding}
              />
            </div>
          ) : undefined
        }
      >
        {drawerBody ?? (
          <div className="space-y-3 text-sm text-slate-700">
            <p>{selected?.subtitle}</p>
            <p className="text-xs text-slate-500">{selected?.meta}</p>
          </div>
        )}
      </SideDrawer>
    </StandardPageLayout>
  );
}
