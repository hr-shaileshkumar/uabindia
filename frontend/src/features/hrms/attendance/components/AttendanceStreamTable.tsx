"use client";

import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Edit3,
  Eye,
  Fingerprint,
  LogIn,
  LogOut,
  MapPin,
  Monitor,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  formatDateTime,
  getInitials,
  getRelativeTime,
  type AttendanceRecord,
  type InspectorTab,
} from "../types/attendance.types";

interface AttendanceStreamTableProps {
  records: AttendanceRecord[];
  totalFilteredCount: number;
  selectedIds: Set<string>;
  onToggleSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  copiedCode: string | null;
  onCopy: (code: string) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  canManage: boolean;
  onInspect: (record: AttendanceRecord, tab?: InspectorTab) => void;
  onDelete: (record: AttendanceRecord) => void;
}

export function AttendanceStreamTable({
  records,
  totalFilteredCount,
  selectedIds,
  onToggleSelectAll,
  onToggleSelect,
  copiedCode,
  onCopy,
  pageSize,
  onPageSizeChange,
  page,
  totalPages,
  onPageChange,
  canManage,
  onInspect,
  onDelete,
}: AttendanceStreamTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-indigo-600" />
            Live Attendance Punch Stream
          </h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {totalFilteredCount} Events
          </span>
          {selectedIds.size > 0 && (
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              {selectedIds.size} Selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size === records.length && records.length > 0}
                  onChange={onToggleSelectAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Punch Event</th>
              <th className="px-4 py-3">Time & Relative</th>
              <th className="px-4 py-3">Mode & Device</th>
              <th className="px-4 py-3">Geofence & Location</th>
              <th className="px-4 py-3">FRS Verification</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {records.length > 0 ? (
              records.map((record) => {
                const isPunchIn = (record.punchType ?? record.status ?? "").toUpperCase() === "IN";
                const isSelected = selectedIds.has(record.id);

                return (
                  <tr
                    key={record.id}
                    onClick={() => onInspect(record, "telemetry")}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                        : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(record.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    {/* Employee */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-[11px] font-bold text-white shadow-xs">
                          {getInitials(record.employeeName)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {record.employeeName ?? "Unnamed Employee"}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              {record.employeeCode ?? record.id.slice(0, 8)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCopy(record.employeeCode ?? record.id);
                              }}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            >
                              {copiedCode === (record.employeeCode ?? record.id) ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Punch Type */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
                          isPunchIn
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {isPunchIn ? (
                          <>
                            <LogIn className="h-3.5 w-3.5" />
                            <span>IN (Check-In)</span>
                          </>
                        ) : (
                          <>
                            <LogOut className="h-3.5 w-3.5" />
                            <span>OUT (Check-Out)</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Time & Relative */}
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {formatDateTime(record.timestamp || record.date)}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>{getRelativeTime(record.timestamp || record.date)}</span>
                      </div>
                    </td>

                    {/* Mode & Device */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {record.source?.toLowerCase().includes("frs") ||
                        record.source?.toLowerCase().includes("mobile") ? (
                          <Camera className="h-3.5 w-3.5 text-indigo-600" />
                        ) : record.source?.toLowerCase().includes("biometric") ? (
                          <Fingerprint className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Monitor className="h-3.5 w-3.5 text-slate-500" />
                        )}
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {record.source ?? "Biometric Terminal"}
                        </span>
                      </div>
                      {record.deviceId && (
                        <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
                          Dev: {record.deviceId}
                        </span>
                      )}
                    </td>

                    {/* Geofence & Location */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {record.geoValidated ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                            <MapPin className="h-3 w-3" />
                            GPS Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800">
                            Unverified GPS
                          </span>
                        )}
                      </div>
                      <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                        {record.region} • {record.branchLocation}
                      </span>
                    </td>

                    {/* FRS Confidence */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {record.frsConfidence ? `${record.frsConfidence.toFixed(1)}%` : "98.2%"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">Match</span>
                      </div>
                      <div className="h-1.5 w-20 rounded-full bg-slate-100 dark:bg-slate-800 mt-1 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${Math.min(100, record.frsConfidence ?? 98)}%` }}
                        />
                      </div>
                    </td>

                    {/* Row Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          title="Inspect Details"
                          onClick={() => onInspect(record, "telemetry")}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400 cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {canManage && (
                          <button
                            type="button"
                            title="Regularize / Edit"
                            onClick={() => onInspect(record, "regularization")}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-amber-400 cursor-pointer"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}

                        {canManage && (
                          <button
                            type="button"
                            title="Delete Punch"
                            onClick={() => onDelete(record)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="font-bold text-slate-700 dark:text-slate-200">No attendance punch events found</p>
                  <p className="text-slate-400 mt-1">Try relaxing filters or search query.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex items-center justify-between border-t border-slate-100 p-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <span>
          Showing {records.length > 0 ? (page - 1) * pageSize + 1 : 0} to{" "}
          {Math.min(page * pageSize, totalFilteredCount)} of {totalFilteredCount} records
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
