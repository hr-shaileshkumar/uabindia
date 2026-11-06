"use client";

import { Camera, MapPin, User, X } from "lucide-react";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpDrawerFooter } from "@/components/workspace/page-kit";
import type { EmployeeOption } from "../types/attendance.types";

interface AttendancePunchDrawerProps {
  open: boolean;
  onClose: () => void;
  employees: EmployeeOption[];
  punchEmployeeId: string;
  onPunchEmployeeIdChange: (id: string) => void;
  punchType: "IN" | "OUT";
  onPunchTypeChange: (type: "IN" | "OUT") => void;
  punchTimestamp: string;
  onPunchTimestampChange: (ts: string) => void;
  punchSource: string;
  onPunchSourceChange: (src: string) => void;
  punchLat: number | undefined;
  onPunchLatChange: (lat: number | undefined) => void;
  punchLng: number | undefined;
  onPunchLngChange: (lng: number | undefined) => void;
  onAutoDetectLocation: () => void;
  frsSimulating: boolean;
  frsVerified: boolean;
  frsScore: number;
  onSimulateFrsScan: () => void;
  punching: boolean;
  onSubmitPunch: () => void;
}

export function AttendancePunchDrawer({
  open,
  onClose,
  employees,
  punchEmployeeId,
  onPunchEmployeeIdChange,
  punchType,
  onPunchTypeChange,
  punchTimestamp,
  onPunchTimestampChange,
  punchSource,
  onPunchSourceChange,
  punchLat,
  onPunchLatChange,
  punchLng,
  onPunchLngChange,
  onAutoDetectLocation,
  frsSimulating,
  frsVerified,
  frsScore,
  onSimulateFrsScan,
  punching,
  onSubmitPunch,
}: AttendancePunchDrawerProps) {
  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title="Record Attendance Punch"
      subtitle="Facial Recognition (FRS) biometric verification with live GPS telemetry"
      width="md"
    >
      <div className="flex h-full flex-col justify-between">
        <div className="space-y-5 p-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="h-5 w-5 text-indigo-600" />
                Record Attendance Punch
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Facial Recognition (FRS) biometric verification with live GPS telemetry.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4 text-xs">
            {/* Employee Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Employee *
              </label>
              <select
                value={punchEmployeeId}
                onChange={(e) => onPunchEmployeeIdChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white cursor-pointer"
              >
                <option value="">-- Select Employee --</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName} {e.employeeCode ? `(${e.employeeCode})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Punch Type */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Punch Event *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onPunchTypeChange("IN")}
                  className={`rounded-xl border py-2.5 font-bold transition-all cursor-pointer ${
                    punchType === "IN"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20 dark:bg-emerald-950 dark:text-emerald-300"
                      : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  Check-In (IN)
                </button>
                <button
                  type="button"
                  onClick={() => onPunchTypeChange("OUT")}
                  className={`rounded-xl border py-2.5 font-bold transition-all cursor-pointer ${
                    punchType === "OUT"
                      ? "border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/20 dark:bg-amber-950 dark:text-amber-300"
                      : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  Check-Out (OUT)
                </button>
              </div>
            </div>

            {/* Timestamp */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Timestamp *
              </label>
              <input
                type="datetime-local"
                value={punchTimestamp}
                onChange={(e) => onPunchTimestampChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Source Mode */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Verification Source / Mode
              </label>
              <select
                value={punchSource}
                onChange={(e) => onPunchSourceChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white cursor-pointer"
              >
                <option value="Mobile Face Recognition (FRS)">Mobile Face Recognition (FRS)</option>
                <option value="Biometric Terminal">Biometric Terminal</option>
                <option value="Web Portal">Web Portal</option>
                <option value="ESS Self-Service">ESS Self-Service</option>
              </select>
            </div>

            {/* FRS Biometric Camera Simulation Box */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-950 dark:bg-indigo-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-indigo-600" />
                  Biometric Face Scan (FRS)
                </span>
                {frsVerified && (
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    {frsScore}% Match ✓
                  </span>
                )}
              </div>

              <div className="relative flex h-36 items-center justify-center rounded-xl bg-slate-900 overflow-hidden">
                {frsSimulating ? (
                  <div className="flex flex-col items-center gap-2 text-white">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                    <span className="font-mono text-[11px]">Analyzing Facial Biometric Vectors...</span>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 space-y-1.5 p-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-indigo-400 text-indigo-400">
                      <User className="h-6 w-6" />
                    </div>
                    <p className="text-[11px] text-slate-300 font-semibold">
                      Facial profile verified with enrolled master embedding.
                    </p>
                  </div>
                )}

                {/* Corner bounding box lines */}
                <div className="pointer-events-none absolute inset-4 border border-indigo-500/40 rounded-lg" />
              </div>

              <button
                type="button"
                onClick={onSimulateFrsScan}
                disabled={frsSimulating}
                className="w-full rounded-xl border border-indigo-200 bg-white py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-900 dark:bg-slate-800 dark:text-indigo-300 cursor-pointer"
              >
                {frsSimulating ? "Scanning..." : "Re-test Facial Recognition"}
              </button>
            </div>

            {/* Geolocation Section */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  Geofence Coordinates
                </span>
                <button
                  type="button"
                  onClick={onAutoDetectLocation}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 cursor-pointer"
                >
                  Detect GPS
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold">Latitude</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={punchLat ?? ""}
                    onChange={(e) => onPunchLatChange(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white p-1.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold">Longitude</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={punchLng ?? ""}
                    onChange={(e) => onPunchLngChange(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-white p-1.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <ErpDrawerFooter
            onCancel={onClose}
            onSave={() => void onSubmitPunch()}
            saving={punching}
            saveLabel="Record Punch"
          />
        </div>
      </div>
    </SideDrawer>
  );
}
