import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Download,
  Filter,
  Plus,
  RefreshCw,
} from "lucide-react";
import DynamicHrmsPage from "../../components/common/DynamicHrmsPage";
import hrmsService from "../../services/hrmsService";
import { useNotification } from "../../context/NotificationContext";

export const AttendanceTracker = () => {
  const { notifySuccess } = useNotification();
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState(null);

  const handlePunch = async () => {
    if (!clockedIn) {
      await hrmsService.clockInOut("clock-in");
      setClockedIn(true);
      setClockTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      notifySuccess("Clock-In recorded via Geofence (Verified)");
    } else {
      await hrmsService.clockInOut("clock-out");
      setClockedIn(false);
      notifySuccess("Clock-Out recorded successfully");
    }
  };

  return (
    <div className="space-y-3">
      {/* Geofence Clock-In Banner & Muster Roll Shortcut */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md text-blue-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold tracking-tight">Geofenced Duty Punch Cockpit</h3>
              <span className="flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <MapPin className="w-2.5 h-2.5" />
                Bangalore Tech Park Campus
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Automated GPS radius validation (250m) & biometric authentication.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/attendance/muster-roll"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            Monthly Muster Roll
          </Link>
          <button
            onClick={handlePunch}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg shadow-2xs transition-all ${
              clockedIn
                ? "bg-rose-500 hover:bg-rose-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {clockedIn ? "Clock Out" : "Punch In Now"}
          </button>
        </div>
      </div>

      <DynamicHrmsPage pageKey="hrms.attendance" />
    </div>
  );
};

export default AttendanceTracker;
