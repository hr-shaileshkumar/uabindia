"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { hrmsApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { enqueueOfflinePunch, syncOfflineQueue } from "@/lib/offlineQueue";
import { MapPin, Navigation, Clock, CheckCircle2, Smartphone, AlertTriangle, ShieldAlert, WifiOff } from "lucide-react";

interface WebCheckInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function WebCheckInModal({ open, onOpenChange, onSuccess }: WebCheckInModalProps) {
  const [punchType, setPunchType] = useState<"IN" | "OUT">("IN");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>("Ready to capture GPS coordinates");
  const [geofenceError, setGeofenceError] = useState<{
    message: string;
    nearestLocation?: string;
    distanceMeters?: number;
    allowedRadius?: number;
    code?: string;
  } | null>(null);

  const detectLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("Geolocation not supported by browser.");
      return;
    }

    setLocating(true);
    setGeofenceError(null);
    setLocationStatus("Acquiring high-accuracy GPS lock...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setLocating(false);
        setLocationStatus(`GPS Locked (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}) ±${Math.round(pos.coords.accuracy)}m accuracy`);
      },
      (err) => {
        setLocating(false);
        setLocationStatus(`GPS capture failed: ${err.message}. Please enable location permissions.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Auto-detect GPS coordinates on modal open & listen for online auto-sync
  useEffect(() => {
    if (open && !coords && !locating) {
      detectLocation();
    }
    if (!open) {
      setGeofenceError(null);
    }

    // Auto-flush offline queue once internet connectivity resumes
    const handleOnline = async () => {
      try {
        const syncResult = await syncOfflineQueue(async (punch) => {
          await hrmsApi.hrms.attendance.webCheckIn({
            punchType: punch.punchType,
            latitude: punch.latitude,
            longitude: punch.longitude,
            deviceInfo: `${punch.deviceId} [SyncedFromOfflineQueue]`,
          });
          return true;
        });
        if (syncResult.synced > 0) {
          notifySuccess(`Synced ${syncResult.synced} offline punches to cloud.`, "Auto-Sync Restored");
          onSuccess?.();
        }
      } catch {
        // Silently retry on next connection event
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      return () => window.removeEventListener("online", handleOnline);
    }
  }, [open, onSuccess]);

  const handlePunch = async () => {
    setGeofenceError(null);
    try {
      setLoading(true);

      // Check if user is offline before attempting network request
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await enqueueOfflinePunch({
          employeeId: "self",
          punchType,
          timestamp: new Date().toISOString(),
          latitude: coords?.lat,
          longitude: coords?.lng,
          source: "WebCheckInModal",
          deviceId: typeof navigator !== "undefined" ? navigator.userAgent : "Browser",
        });
        notifySuccess(
          `You are offline. Recorded check-${punchType.toLowerCase()} locally. It will auto-sync once connected.`,
          "Offline Punch Stored"
        );
        onOpenChange(false);
        onSuccess?.();
        return;
      }

      const res: any = await hrmsApi.hrms.attendance.webCheckIn({
        punchType,
        latitude: coords?.lat,
        longitude: coords?.lng,
        deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : "Browser",
      });

      const matchedLoc = res?.data?.matchedLocationName;
      const successDetail = matchedLoc
        ? `Verified at ${matchedLoc}.`
        : `Confirmed at ${new Date().toLocaleTimeString()}.`;

      notifySuccess(
        `Web check-${punchType.toLowerCase()} ${successDetail}`,
        "Punch Confirmed"
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      // If network disconnection occurs during API call, fall back to offline queue
      if (err?.message?.includes("Network Error") || !err?.response) {
        try {
          await enqueueOfflinePunch({
            employeeId: "self",
            punchType,
            timestamp: new Date().toISOString(),
            latitude: coords?.lat,
            longitude: coords?.lng,
            source: "WebCheckInModal",
            deviceId: typeof navigator !== "undefined" ? navigator.userAgent : "Browser",
          });
          notifySuccess(
            `Network unreachable. Punch secured in offline tamper-proof queue.`,
            "Offline Fallback Active"
          );
          onOpenChange(false);
          onSuccess?.();
          return;
        } catch {
          // Continue to display error
        }
      }

      const resData = err?.response?.data;
      if (resData?.geofenceBreach || resData?.code === "GEOFENCE_BREACH" || resData?.code === "GPS_REQUIRED" || resData?.code === "BASE_LOCATION_NOT_CONFIGURED") {
        setGeofenceError({
          message: resData.message || "Geofence boundary breach detected.",
          nearestLocation: resData.nearestLocation,
          distanceMeters: resData.distanceMeters,
          allowedRadius: resData.allowedRadius,
          code: resData.code,
        });
      } else {
        notifyError(err?.message || "Failed to record web check-in.", "Check-In Error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 sm:rounded-2xl">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Smartphone className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                1-Tap Self-Service Web Punch
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Record real-time attendance with browser GPS validation and device telemetry.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-4 space-y-4">
          {/* Punch Direction Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select Punch Action</label>
            <div className="grid grid-cols-2 gap-3 mt-1.5">
              <button
                type="button"
                onClick={() => setPunchType("IN")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                  punchType === "IN"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <Clock className="h-4 w-4" />
                PUNCH IN
              </button>

              <button
                type="button"
                onClick={() => setPunchType("OUT")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                  punchType === "OUT"
                    ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 ring-2 ring-rose-500/20"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                <Clock className="h-4 w-4" />
                PUNCH OUT
              </button>
            </div>
          </div>

          {/* GPS Coordinates Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                Location Telemetry
              </span>
              <button
                type="button"
                onClick={detectLocation}
                disabled={locating}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Navigation className={`h-3 w-3 ${locating ? "animate-spin" : ""}`} />
                {locating ? "Locating..." : "Auto-Detect GPS"}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{locationStatus}</p>
          </div>

          {/* Geofence Breach Alert Banner */}
          {geofenceError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 dark:border-rose-900/60 dark:bg-rose-950/40 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="p-1 rounded-md bg-rose-100 dark:bg-rose-900/70 text-rose-700 dark:text-rose-300 mt-0.5">
                  <ShieldAlert className="h-4 w-4" />
                </span>
                <div className="space-y-1">
                  <p className="font-bold text-rose-800 dark:text-rose-200">
                    Geofence Boundary Breach
                  </p>
                  <p className="text-rose-700/90 dark:text-rose-300/90 leading-relaxed text-[11px]">
                    {geofenceError.message}
                  </p>
                  {geofenceError.distanceMeters != null && (
                    <div className="flex items-center gap-2 pt-1 text-[11px] font-semibold text-rose-800 dark:text-rose-300">
                      <span>Distance: {geofenceError.distanceMeters}m</span>
                      {geofenceError.allowedRadius && (
                        <span>• Allowed: {geofenceError.allowedRadius}m</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handlePunch()}
            disabled={loading}
            className={`flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50 ${
              punchType === "IN" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {loading ? "Recording..." : `Confirm ${punchType} Punch`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
