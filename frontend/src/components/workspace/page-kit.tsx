"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Eye, Pencil, Plus, RefreshCw, Trash2, History, Download, Filter } from "lucide-react";
import { buttonClassName } from "@/components/workspace/styles";
import { cn } from "@/lib/utils";

/** Header/row actions for StandardPageLayout and workspace pages */

/** Primary header create action */
export function CreateButton({
  label = "New",
  onClick,
  disabled,
  loading,
}: {
  label?: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(buttonClassName.primary, "gap-1.5")}
    >
      {loading ? (
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Plus className="h-3.5 w-3.5" />
      )}
      <span>{label}</span>
    </button>
  );
}

/** Explicit page/register refresh button with spinning feedback */
export function RefreshButton({
  onClick,
  loading,
  label,
}: {
  onClick?: () => void;
  loading?: boolean;
  label?: string;
}) {
  const [localLoading, setLocalLoading] = useState(false);

  const handleClick = () => {
    if (!onClick) return;
    setLocalLoading(true);
    onClick();
    setTimeout(() => setLocalLoading(false), 600);
  };

  const isLoading = loading ?? localLoading;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      title={label || "Refresh data"}
      aria-label={label || "Refresh data"}
      className={cn(buttonClassName.secondary, "gap-1.5 px-2.5")}
    >
      <RefreshCw className={cn("h-3.5 w-3.5 transition-transform", isLoading && "animate-spin text-blue-600 dark:text-blue-400")} />
      {label && <span>{label}</span>}
    </button>
  );
}

/** Secondary export button (CSV / Excel / PDF) */
export function ExportButton({
  onClick,
  disabled,
  label = "Export",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(buttonClassName.secondary, "gap-1.5")}
    >
      <Download className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
      <span>{label}</span>
    </button>
  );
}

/** Secondary filter toggle button */
export function FilterButton({
  onClick,
  activeCount = 0,
  label = "Filters",
}: {
  onClick: () => void;
  activeCount?: number;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        buttonClassName.secondary,
        "gap-1.5",
        activeCount > 0 && "border-blue-300 bg-blue-50/60 text-blue-700 font-semibold dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
      )}
    >
      <Filter className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
      <span>{label}</span>
      {activeCount > 0 && (
        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-xs">
          {activeCount}
        </span>
      )}
    </button>
  );
}

type RowAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

/** Standard row action cluster (View, Edit, Audit, Delete) */
export function RowActions({
  onView,
  onEdit,
  onAudit,
  onDelete,
  extra,
}: {
  onView?: RowAction;
  onEdit?: RowAction;
  onAudit?: RowAction;
  onDelete?: RowAction;
  extra?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      {onView ? (
        <button
          type="button"
          title={onView.label}
          disabled={onView.disabled}
          onClick={onView.onClick}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 disabled:opacity-40"
        >
          <Eye className="h-3.5 w-3.5" />
          <span className="sr-only">{onView.label}</span>
        </button>
      ) : null}
      {onEdit ? (
        <button
          type="button"
          title={onEdit.label}
          disabled={onEdit.disabled}
          onClick={onEdit.onClick}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 disabled:opacity-40"
        >
          <Pencil className="h-3.5 w-3.5" />
          <span className="sr-only">{onEdit.label}</span>
        </button>
      ) : null}
      {onAudit ? (
        <button
          type="button"
          title={onAudit.label || "Audit History"}
          disabled={onAudit.disabled}
          onClick={onAudit.onClick}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/60 disabled:opacity-40"
        >
          <History className="h-3.5 w-3.5" />
          <span className="sr-only">{onAudit.label || "Audit History"}</span>
        </button>
      ) : null}
      {extra}
      {onDelete ? (
        <button
          type="button"
          title={onDelete.label}
          disabled={onDelete.disabled}
          onClick={onDelete.onClick}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40 disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="sr-only">{onDelete.label}</span>
        </button>
      ) : null}
    </div>
  );
}

/** Drawer / modal form footer */
export function DrawerFooter({
  onCancel,
  onSave,
  saving,
  saveLabel,
  isEdit,
  disabled,
}: {
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
  saveLabel?: string;
  isEdit?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3 rounded-b-2xl dark:border-slate-800 dark:bg-slate-950/60">
      <button type="button" onClick={onCancel} disabled={saving} className={buttonClassName.secondary}>
        Cancel
      </button>
      <button type="button" onClick={onSave} disabled={saving || disabled} className={buttonClassName.primary}>
        {saving ? "Saving…" : saveLabel || (isEdit ? "Update Changes" : "Save Record")}
      </button>
    </div>
  );
}

/** Responsive search input */
export function SearchFilter({
  value,
  onChange,
  placeholder = "Search records…",
  label = "Search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}) {
  return (
    <div className="min-w-48 flex-1">
      {label && <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-300">{label}</label>}
      <input
        className="erp-input h-8.5 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

/** Workflow approve/reject buttons */
export function ApproveRejectButtons({
  onApprove,
  onReject,
  disabled,
  approveLabel = "Approve",
  rejectLabel = "Reject",
}: {
  onApprove: () => void;
  onReject: () => void;
  disabled?: boolean;
  approveLabel?: string;
  rejectLabel?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={disabled}
        onClick={onApprove}
        className={cn(buttonClassName.primary, "text-xs")}
      >
        {approveLabel}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onReject}
        className={cn(buttonClassName.secondary, "text-xs text-rose-700 hover:bg-rose-50 border-rose-200 dark:text-rose-300 dark:hover:bg-rose-950/40 dark:border-rose-800/60")}
      >
        {rejectLabel}
      </button>
    </div>
  );
}

/** Empty state component */
export function EmptyState({
  message = "No records found.",
  description = "Get started by creating a new entry or adjusting your search filters.",
  action,
  icon,
}: {
  message?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-12 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100/80 text-slate-400 ring-1 ring-slate-200/60 shadow-xs dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">
        {icon ?? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
        )}
      </div>
      <div className="max-w-sm space-y-0.5">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{message}</p>
        {description && <p className="text-xs text-slate-500 leading-relaxed dark:text-slate-400">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// Backward-compatible aliases
export const ErpCreateButton = CreateButton;
export const StandardCreateButton = CreateButton;
export const ErpRefreshButton = RefreshButton;
export const ErpExportButton = ExportButton;
export const ErpFilterButton = FilterButton;
export const ErpRowActions = RowActions;
export const TableRowActions = RowActions;
export const ErpDrawerFooter = DrawerFooter;
export const ErpSearchFilter = SearchFilter;
export const ErpApproveRejectButtons = ApproveRejectButtons;
export const ErpEmptyState = EmptyState;

export { default as RegisterPage } from "@/features/shared/components/ModuleTablePage";
export { default as ErpRegisterPage } from "@/features/shared/components/ModuleTablePage";
export type { ModuleTableColumn as RegisterColumn, ModuleTableColumn as ErpRegisterColumn } from "@/features/shared/components/ModuleTablePage";
export { TabBar, TabPanel, ErpTabBar, ErpTabPanel } from "@/components/workspace/tab-bar";
export type { TabItem, ErpTabItem } from "@/components/workspace/tab-bar";
