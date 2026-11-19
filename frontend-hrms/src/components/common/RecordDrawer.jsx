import React, { useState } from "react";
import {
  X,
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  Edit2,
  Printer,
  Share2,
} from "lucide-react";
import StatusBadge from "./StatusBadge";

export const RecordDrawer = ({
  isOpen,
  onClose,
  record,
  schema,
  onEdit,
  onTransition,
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  if (!isOpen || !record) return null;

  const title =
    record.fullName ||
    record.title ||
    record.employeeName ||
    record.name ||
    record.id ||
    "Record Details";

  const code =
    record.employeeCode ||
    record.requisitionCode ||
    record.candidateCode ||
    record.shiftCode ||
    record.assetTag ||
    record.code ||
    record.id;

  const status = record.status || record.overallStatus || "Active";
  const workflow = schema?.workflowConfig;

  // Available transitions based on current state
  const availableTransitions = (workflow?.transitions || []).filter((t) => {
    return t.fromState === "*" || t.fromState === status;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
            <div className="min-w-0 flex-1 pr-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10.5px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                  {code}
                </span>
                <StatusBadge status={status} />
              </div>
              <h2 className="text-base font-bold text-slate-900 truncate tracking-tight">
                {title}
              </h2>
              {schema?.entityName && (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {schema.entityName} Master Profile
                </p>
              )}
            </div>

            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(record)}
                  className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                  title="Edit Record"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Workflow Action Bar (if applicable) */}
          {availableTransitions.length > 0 && (
            <div className="px-4 py-2 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-blue-900 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-blue-600" />
                Actions:
              </span>
              <div className="flex items-center gap-1.5">
                {availableTransitions.map((t) => {
                  const isDanger = t.variant === "danger";
                  const isSuccess = t.variant === "success";

                  return (
                    <button
                      key={t.action}
                      onClick={() => onTransition && onTransition(record, t.toState, t.action)}
                      className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md shadow-2xs transition-colors ${
                        isDanger
                          ? "bg-rose-600 text-white hover:bg-rose-700"
                          : isSuccess
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-slate-100 px-4 bg-white">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-2 text-xs font-semibold border-b-2 mr-4 transition-colors ${
                activeTab === "overview"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-800"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`py-2 text-xs font-semibold border-b-2 mr-4 transition-colors ${
                activeTab === "timeline"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-800"
              }`}
            >
              Audit Timeline
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === "documents"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-800"
              }`}
            >
              Attachments
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Visual Avatar / Hero card if employee */}
                {record.avatarUrl && (
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <img
                      src={record.avatarUrl}
                      alt={title}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-blue-600/20"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
                      <p className="text-xs text-slate-500">{record.designationName || record.appliedJob || "Team Member"}</p>
                      <p className="text-xs text-blue-600 font-medium mt-0.5">{record.departmentName || "Engineering"}</p>
                    </div>
                  </div>
                )}

                {/* Field-Value Key Matrix */}
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(record)
                    .filter(
                      ([key]) =>
                        !["id", "avatarUrl", "remarks", "description"].includes(key)
                    )
                    .map(([key, value]) => {
                      // Pretty label
                      const label = key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase());

                      let displayVal = value;
                      if (typeof value === "object" && value !== null) {
                        displayVal = JSON.stringify(value);
                      } else if (typeof value === "boolean") {
                        displayVal = value ? "Yes" : "No";
                      } else if (key.toLowerCase().includes("ctc") || key.toLowerCase().includes("salary") || key.toLowerCase().includes("cost")) {
                        displayVal = `₹ ${Number(value).toLocaleString("en-IN")}`;
                      }

                      return (
                        <div key={key} className="p-3 rounded-lg bg-slate-50/70 border border-slate-100">
                          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            {label}
                          </div>
                          <div className="text-xs font-medium text-slate-800 break-words">
                            {String(displayVal ?? "—")}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Description / Remarks section */}
                {(record.description || record.reason || record.remarks) && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-xs font-semibold text-slate-700 mb-1.5">
                      Notes & Description
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {record.description || record.reason || record.remarks}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="space-y-4">
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-white" />
                    <div className="text-xs font-bold text-slate-900">Current Status: {status}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Updated recently by System Workflow</div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-white" />
                    <div className="text-xs font-bold text-slate-900">Record Initialized</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Created with code {code}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-3 text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-slate-800">Verified System Documents</div>
                <div className="text-xs text-slate-500 max-w-xs mx-auto">
                  Statutory KYC documents, appointment letters, and compensation annexures are securely encrypted.
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono text-[11px]">ID: {record.id}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Record
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordDrawer;
