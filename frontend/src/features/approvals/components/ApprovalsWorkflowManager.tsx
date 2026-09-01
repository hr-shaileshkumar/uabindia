"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { ErpRefreshButton } from "@/components/workspace/page-kit";
import { StatusBadge } from "@/components/workspace/status-badge";
import { appApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import {
  CheckCircle2,
  XCircle,
  Search,
  FileText,
  Calendar,
  CreditCard,
  ShoppingBag,
  UserCheck,
  DollarSign,
  Layers,
  X,
  MessageSquare,
} from "lucide-react";

export type ApprovalRequestDto = {
  id: string;
  moduleKey?: string;
  entityType?: string;
  entityId?: string;
  currentStep?: number;
  status?: string;
  requestedBy?: string;
  requestedAt?: string;
  comments?: string;
  amount?: number;
  department?: string;
  urgency?: "Normal" | "High" | "Urgent";
};

export const CATEGORIES = [
  { id: "ALL", label: "All Requests", icon: Layers },
  { id: "Leave", label: "Leaves & Time", icon: Calendar },
  { id: "Expense", label: "Expense Claims", icon: CreditCard },
  { id: "PurchaseOrder", label: "Purchase Orders", icon: ShoppingBag },
  { id: "VendorBill", label: "Vendor Invoices", icon: FileText },
  { id: "Attendance", label: "Attendance Fixes", icon: UserCheck },
  { id: "Payroll", label: "Payroll Runs", icon: DollarSign },
];

export function ApprovalsWorkflowManager() {
  const [rows, setRows] = useState<ApprovalRequestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Pending");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Drawer / Inspection state
  const [activeItem, setActiveItem] = useState<ApprovalRequestDto | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [deciding, setDeciding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await appApi.approvals.list(status);
      const rawList = (Array.isArray(data) ? data : []) as ApprovalRequestDto[];

      setRows(rawList);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load approvals queue."));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (selectedCategory !== "ALL" && r.entityType !== selectedCategory) return false;
      if (status !== "ALL" && (r.status ?? "Pending") !== status) return false;
      if (q) {
        const text = `${r.entityType ?? ""} ${r.entityId ?? ""} ${r.requestedBy ?? ""} ${r.comments ?? ""} ${r.department ?? ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, selectedCategory, status]);

  const stats = useMemo(() => {
    const pendingCount = rows.filter((r) => (r.status ?? "Pending") === "Pending").length;
    const leaveCount = rows.filter((r) => r.entityType === "Leave").length;
    const poCount = rows.filter((r) => r.entityType === "PurchaseOrder").length;
    const expenseCount = rows.filter((r) => r.entityType === "Expense").length;

    return { pendingCount, leaveCount, poCount, expenseCount, total: rows.length };
  }, [rows]);

  const handleDecision = async (item: ApprovalRequestDto, approve: boolean) => {
    try {
      setDeciding(true);
      if (approve) {
        await appApi.approvals.approve(item.id, { comments: decisionNotes || undefined });
        notifySuccess(`Request ${item.entityId ?? item.id} approved successfully.`, "Workflow");
      } else {
        await appApi.approvals.reject(item.id, { comments: decisionNotes || undefined });
        notifySuccess(`Request ${item.entityId ?? item.id} rejected.`, "Workflow");
      }
      setActiveItem(null);
      setDecisionNotes("");
      await load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, approve ? "Approval failed." : "Rejection failed."), "Workflow");
    } finally {
      setDeciding(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    notifySuccess(`${selectedIds.size} requests approved in bulk batch.`, "Workflow");
    setSelectedIds(new Set());
    await load();
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRows.map((r) => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <StandardPageLayout
      title="Unified Workflow & Approvals Queue"
      subtitle="Centralized governance inbox for multi-level Leaves, Expenses, Purchases, and Invoices."
      actions={
        <div className="flex items-center gap-2">
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={() => void handleBulkApprove()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve Selected ({selectedIds.size})
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {error ? <div className="erp-alert-error">{error}</div> : null}

        {/* KPI Strip */}
        <CrudHeaderStats
          items={[
            { label: "Pending Approvals", value: stats.pendingCount, tone: "warning" },
            { label: "Leaves & Time", value: stats.leaveCount, tone: "info" },
            { label: "Purchase Orders", value: stats.poCount, tone: "neutral" },
            { label: "Expense Claims", value: stats.expenseCount, tone: "positive" },
          ]}
        />

        {/* Category Pill Filter Bar */}
        <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-sm font-bold"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-slate-400"}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Queue Table Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          {/* Table Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Queue</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {filteredRows.length} Requests
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by requester, ID, notes..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="Pending">Pending Decision</option>
                <option value="Approved">Approved History</option>
                <option value="Rejected">Rejected</option>
                <option value="ALL">All Statuses</option>
              </select>
            </div>
          </div>

          {/* Table Body */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredRows.length && filteredRows.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-4 py-3">Request & Type</th>
                  <th className="px-4 py-3">Requester & Dept</th>
                  <th className="px-4 py-3">Details / Purpose</th>
                  <th className="px-4 py-3">Amount / Impact</th>
                  <th className="px-4 py-3">Requested Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRows.length > 0 ? (
                  filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setActiveItem(row)}
                      className="cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => toggleSelect(row.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {row.entityId ?? row.id}
                        </div>
                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {row.entityType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-200">
                          {row.requestedBy ?? "Unknown User"}
                        </div>
                        <div className="text-[11px] text-slate-400">{row.department ?? "General"}</div>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-slate-600 dark:text-slate-400">
                        {row.comments || "No notes provided."}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {row.amount ? `₹${row.amount.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {row.requestedAt ? new Date(row.requestedAt).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={row.status ?? "Pending"}
                          tone={
                            row.status === "Approved"
                              ? "positive"
                              : row.status === "Rejected"
                              ? "danger"
                              : "warning"
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleDecision(row, true)}
                            className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 cursor-pointer"
                            title="Quick Approve"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDecision(row, false)}
                            className="rounded-lg bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 cursor-pointer"
                            title="Quick Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-xs text-slate-500">
                      No requests found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Slide-over Decision Drawer */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity">
          <div className="w-full max-w-lg bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Request Details ({activeItem.entityId ?? activeItem.id})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Review request before authorizing</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50 space-y-2">
                <p className="font-semibold text-slate-400 uppercase text-[10px]">Requester Information</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{activeItem.requestedBy}</p>
                <p className="text-slate-500 dark:text-slate-400">Department: {activeItem.department ?? "General"}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Category</p>
                  <p className="mt-1 font-bold text-slate-900 dark:text-white">{activeItem.entityType}</p>
                </div>
                <div className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Financial Impact</p>
                  <p className="mt-1 font-bold text-slate-900 dark:text-white">
                    {activeItem.amount ? `₹${activeItem.amount.toLocaleString("en-IN")}` : "N/A"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800 space-y-1.5">
                <p className="text-slate-400 text-[10px] uppercase font-bold">Submission Notes / Justification</p>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                  {activeItem.comments || "No detailed justification submitted."}
                </p>
              </div>

              {/* Decision Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                  Approval / Rejection Comments
                </label>
                <textarea
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Add approval remarks or rejection rationale..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={deciding}
                  onClick={() => void handleDecision(activeItem, false)}
                  className="inline-flex justify-center items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 cursor-pointer"
                >
                  <XCircle className="h-4 w-4" /> Reject Request
                </button>
                <button
                  type="button"
                  disabled={deciding}
                  onClick={() => void handleDecision(activeItem, true)}
                  className="inline-flex justify-center items-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve & Sign Off
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </StandardPageLayout>
  );
}

export default ApprovalsWorkflowManager;
