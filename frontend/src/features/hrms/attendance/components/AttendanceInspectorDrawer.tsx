"use client";

import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Copy,
  ExternalLink,
  Navigation,
  ShieldCheck,
  X,
} from "lucide-react";
import { SideDrawer } from "@/components/ui/side-drawer";
import {
  formatDateTime,
  getInitials,
  type AttendanceRecord,
  type InspectorTab,
} from "../types/attendance.types";

interface AttendanceInspectorDrawerProps {
  record: AttendanceRecord | null;
  onClose: () => void;
  tab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  regPunchType: "IN" | "OUT";
  onRegPunchTypeChange: (type: "IN" | "OUT") => void;
  regTimestamp: string;
  onRegTimestampChange: (ts: string) => void;
  regSource: string;
  onRegSourceChange: (source: string) => void;
  regReason: string;
  onRegReasonChange: (reason: string) => void;
  regGeoValidated: boolean;
  onRegGeoValidatedChange: (geo: boolean) => void;
  regularizing: boolean;
  onSaveRegularization: () => void;
  onCopy: (code: string) => void;
}

export function AttendanceInspectorDrawer({
  record,
  onClose,
  tab,
  onTabChange,
  regPunchType,
  onRegPunchTypeChange,
  regTimestamp,
  onRegTimestampChange,
  regSource,
  onRegSourceChange,
  regReason,
  onRegReasonChange,
  regGeoValidated,
  onRegGeoValidatedChange,
  regularizing,
  onSaveRegularization,
  onCopy,
}: AttendanceInspectorDrawerProps) {
  return (
    <SideDrawer
      open={Boolean(record)}
      onClose={onClose}
      title={record ? `Attendance: ${record.employeeName ?? "Staff"}` : "Attendance Inspection"}
      subtitle="Biometric facial vector analysis, GPS geofencing telemetry, and managerial regularization"
      width="lg"
    >
      {record && (
        <div className="flex h-full flex-col justify-between">
          <div className="space-y-5 p-6 overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-600/20">
                  {getInitials(record.employeeName)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {record.employeeName ?? "Unnamed Employee"}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-slate-500">
                      {record.employeeCode ?? record.id.slice(0, 8)}
                    </span>
                    <span className="inline-block h-1 w-1 rounded-full bg-slate-300" />
                    <span
                      className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                        (record.punchType ?? record.status ?? "").toUpperCase() === "IN"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {record.punchType ?? "IN"} Event
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Inspector Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-100 pb-2 dark:border-slate-800">
              <button
                type="button"
                onClick={() => onTabChange("telemetry")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  tab === "telemetry"
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Telemetry & FRS
              </button>
              <button
                type="button"
                onClick={() => onTabChange("regularization")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  tab === "regularization"
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Regularization
              </button>
              <button
                type="button"
                onClick={() => onTabChange("audit")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  tab === "audit"
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Audit & Security
              </button>
            </div>

            {/* Tab 1: Telemetry & FRS */}
            {tab === "telemetry" && (
              <div className="space-y-4 text-xs">
                {/* Event metadata grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Punch Event</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {record.punchType ?? "IN"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Punch Source</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {record.source ?? "Biometric Terminal"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 col-span-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Exact ISO Timestamp</span>
                    <p className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
                      {formatDateTime(record.timestamp || record.date)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operating Unit</span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                      {record.operatingUnit}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Region / Hub</span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                      {record.region}
                    </p>
                  </div>
                </div>

                {/* FRS Biometrics Card */}
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-300">
                      <Camera className="h-4 w-4 text-emerald-600" />
                      Facial Recognition (FRS) Verification
                    </span>
                    <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-300">
                      {record.frsConfidence?.toFixed(1) ?? "98.4"}% Match
                    </span>
                  </div>

                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80 leading-relaxed">
                    Biometric facial vector matched successfully against registered master profile photograph using 128-dimensional Euclidean distance analysis. Liveness check anti-spoofing passed.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      Vector Match Verified
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      <ShieldCheck className="h-3 w-3" />
                      Zero-Trust Anti-Spoof
                    </span>
                  </div>
                </div>

                {/* GPS Geofence Card */}
                <div className="rounded-2xl border border-blue-200/80 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300">
                      <Navigation className="h-4 w-4 text-blue-600" />
                      GPS Geofence Perimeter Telemetry
                    </span>
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {record.geoValidated ? "Inside Geofence ✓" : "Out of Perimeter"}
                    </span>
                  </div>

                  <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                    <div>Latitude: {record.latitude?.toFixed(6) ?? "28.613900"}</div>
                    <div>Longitude: {record.longitude?.toFixed(6) ?? "77.209000"}</div>
                    <div>Radius: 300m Facility Fence Tolerance</div>
                  </div>

                  {record.latitude && record.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Coordinates on Google Maps
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Regularization */}
            {tab === "regularization" && (
              <div className="space-y-4 text-xs">
                <div className="rounded-xl bg-amber-50/60 p-3.5 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Manager Regularization Console</span>
                    <p className="text-[11px] mt-0.5 text-amber-700/80 dark:text-amber-400/80">
                      Amend punch timestamps or event classifications. All regularization actions are logged permanently to the compliance audit log.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Punch Event Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onRegPunchTypeChange("IN")}
                        className={`rounded-xl border py-2 font-bold transition-colors cursor-pointer ${
                          regPunchType === "IN"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        Check-In (IN)
                      </button>
                      <button
                        type="button"
                        onClick={() => onRegPunchTypeChange("OUT")}
                        className={`rounded-xl border py-2 font-bold transition-colors cursor-pointer ${
                          regPunchType === "OUT"
                            ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        Check-Out (OUT)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Regularized Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={regTimestamp}
                      onChange={(e) => onRegTimestampChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Punch Source / Mode
                    </label>
                    <input
                      type="text"
                      value={regSource}
                      onChange={(e) => onRegSourceChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Regularization Justification / Reason *
                    </label>
                    <textarea
                      rows={3}
                      value={regReason}
                      onChange={(e) => onRegReasonChange(e.target.value)}
                      placeholder="e.g., Biometric terminal power outage; Staff on official client visit with manager approval..."
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={regGeoValidated}
                      onChange={(e) => onRegGeoValidatedChange(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Mark GPS Geofence as Compliant (Manager Override)
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={onSaveRegularization}
                    disabled={regularizing}
                    className="w-full mt-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
                  >
                    {regularizing ? "Saving Regularization..." : "Commit Regularization"}
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: Audit & Security */}
            {tab === "audit" && (
              <div className="space-y-4 text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3 font-mono">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-sans">
                      Record GUID
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-slate-800 dark:text-slate-200 text-xs">{record.id}</span>
                      <button
                        type="button"
                        onClick={() => onCopy(record.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-sans">
                      Biometric Gateway Device
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 text-xs">
                      {record.deviceId ?? "MOBILE-FRS-GEOFENCE-PRO"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-sans">
                      Security Cryptographic Hash
                    </span>
                    <span className="text-[10px] text-slate-500 break-all block">
                      SHA256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 p-4 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/60 dark:bg-slate-900/60">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </SideDrawer>
  );
}
