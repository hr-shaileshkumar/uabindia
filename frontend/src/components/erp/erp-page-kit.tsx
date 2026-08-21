"use client";

import type { ReactNode } from "react";
import { Eye, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { erpButtonClassName } from "@/components/erp/erpStyles";
import { cn } from "@/lib/utils";

/** Header/row actions for `StandardPageLayout`. Do not invent a third page chrome. */

/** Primary header action — always the last control on the right. */
export function ErpCreateButton({
  label = "New",
  onClick,
  disabled,
}: {
  label?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${erpButtonClassName.primary} gap-1.5`}>
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}

export function ErpRefreshButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={loading} className={erpButtonClassName.secondary}>
      <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
      Refresh
    </button>
  );
}

type RowAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

/**
 * Standard row actions: View, Edit, Delete. Extra workflow actions go in `extra`.
 * Never put Create here — Create belongs in the page header.
 */
export function ErpRowActions({
  onView,
  onEdit,
  onDelete,
  extra,
}: {
  onView?: RowAction;
  onEdit?: RowAction;
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
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
        >
          <Eye className="h-4 w-4" />
          <span className="sr-only">{onView.label}</span>
        </button>
      ) : null}
      {onEdit ? (
        <button
          type="button"
          title={onEdit.label}
          disabled={onEdit.disabled}
          onClick={onEdit.onClick}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">{onEdit.label}</span>
        </button>
      ) : null}
      {extra}
      {onDelete ? (
        <button
          type="button"
          title={onDelete.label}
          disabled={onDelete.disabled}
          onClick={onDelete.onClick}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-rose-500 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">{onDelete.label}</span>
        </button>
      ) : null}
    </div>
  );
}

/** Drawer / form footer — Cancel left, Save right. */
export function ErpDrawerFooter({
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
    <div className="flex items-center justify-end gap-2">
      <button type="button" onClick={onCancel} disabled={saving} className={erpButtonClassName.secondary}>
        Cancel
      </button>
      <button type="button" onClick={onSave} disabled={saving || disabled} className={erpButtonClassName.primary}>
        {saving ? "Saving…" : saveLabel || (isEdit ? "Update" : "Save")}
      </button>
    </div>
  );
}

export function ErpSearchFilter({
  value,
  onChange,
  placeholder = "Search…",
  label = "Search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}) {
  return (
    <div className="min-w-48 flex-1">
      <label className="erp-label">{label}</label>
      <input
        className="erp-input"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

/** Workflow queue row/drawer actions — Approve + Reject only. */
export function ErpApproveRejectButtons({
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
        className={`${erpButtonClassName.primary} text-xs`}
      >
        {approveLabel}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onReject}
        className={`${erpButtonClassName.secondary} text-xs text-rose-700 hover:bg-rose-50`}
      >
        {rejectLabel}
      </button>
    </div>
  );
}

/** Honest empty state for list pages with optional New action. */
export function ErpEmptyState({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <p className="text-sm text-slate-500">{message}</p>
      {action}
    </div>
  );
}
