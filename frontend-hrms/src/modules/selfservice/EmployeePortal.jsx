import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  Calendar,
  FileText,
  Laptop,
  CheckCircle2,
  Download,
  Plus,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import hrmsService from "../../services/hrmsService";
import { useNotification } from "../../context/NotificationContext";

export const EmployeePortal = () => {
  const { user } = useAuth();
  const { notifySuccess } = useNotification();
  const [clockedIn, setClockedIn] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      hrmsService.getLeaves(),
      hrmsService.getPayslips(),
      hrmsService.getAttendance(),
    ]).then(([leaveData, payslipData, attendanceData]) => {
      if (mounted) {
        setLeaves(leaveData || []);
        setPayslips(payslipData || []);
        const todayStr = new Date().toISOString().split("T")[0];
        const todayPunch = (attendanceData || []).find((a) => a.date === todayStr);
        if (todayPunch && todayPunch.checkInTime && (!todayPunch.checkOutTime || todayPunch.checkOutTime === "-")) {
          setClockedIn(true);
        }
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handlePunch = async () => {
    if (!clockedIn) {
      await hrmsService.clockInOut("clock-in");
      setClockedIn(true);
      notifySuccess("Duty Punch In recorded via Geofence (Verified)");
    } else {
      await hrmsService.clockInOut("clock-out");
      setClockedIn(false);
      notifySuccess("Duty Punch Out recorded successfully");
    }
  };

  const latestSlip = payslips[0] || null;

  return (
    <div className="space-y-4">
      {/* Header Profile Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3.5">
          <img
            src={
              user?.avatarUrl ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
            }
            alt="Profile"
            className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/20 shadow-xs shrink-0"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-blue-400 px-2 py-0.5 rounded-full bg-white/10">
                Self-Service (ESS)
              </span>
              <span className="text-[10px] text-slate-300 font-mono">EMP-1001</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold mt-0.5 text-white">
              {user?.fullName || "Aarav Sharma"}
            </h1>
            <p className="text-xs text-slate-300">
              {user?.roleTitle || "Staff Software Architect"} • {user?.department || "Engineering"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block mr-2">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Shift Schedule</div>
            <div className="text-xs font-semibold text-slate-200">09:00 AM - 06:00 PM (IST)</div>
          </div>
          <button
            onClick={handlePunch}
            className={`h-8 px-4 text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 ${
              clockedIn
                ? "bg-rose-500 hover:bg-rose-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {clockedIn ? "Punch Out of Shift" : "Punch In for Today"}
          </button>
        </div>
      </div>

      {/* Grid: Leaves, Attendance, Latest Payslip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Leave Balances Card */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-800">
                My Leave Quotas
              </h3>
              <p className="text-[10.5px] text-slate-400">Available annual entitlements</p>
            </div>
            <Link
              to="/leave"
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3 h-3" />
              Apply Leave
            </Link>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800 text-xs">Casual Leave (CL)</div>
                <div className="text-[10px] text-slate-400">Personal & short absences</div>
              </div>
              <span className="text-xs font-bold text-emerald-600 font-mono">8 / 12</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800 text-xs">Sick Leave (SL)</div>
                <div className="text-[10px] text-slate-400">Medical emergency</div>
              </div>
              <span className="text-xs font-bold text-blue-600 font-mono">10 / 10</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800 text-xs">Privilege Leave (PL)</div>
                <div className="text-[10px] text-slate-400">Carry-forward eligible</div>
              </div>
              <span className="text-xs font-bold text-purple-600 font-mono">15 / 18</span>
            </div>
          </div>
        </div>

        {/* Latest Payslip Summary */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-800">
                Latest Payslip
              </h3>
              <p className="text-[10.5px] text-slate-400">Disbursed net take-home</p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Disbursed
            </span>
          </div>

          <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-xs space-y-1.5">
            <div className="text-[9.5px] text-blue-700 uppercase font-bold">
              Period: {latestSlip?.month || "October 2026"}
            </div>
            <div className="flex justify-between items-center text-slate-700 text-xs">
              <span>Gross Earnings:</span>
              <span className="font-mono font-semibold">₹ {(latestSlip?.gross || 185000).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700 text-xs">
              <span>Statutory Deductions:</span>
              <span className="font-mono font-semibold text-rose-600">- ₹ {(latestSlip?.totalDeductions || 20500).toLocaleString("en-IN")}</span>
            </div>
            <div className="pt-1.5 border-t border-blue-200/70 flex justify-between items-center font-bold text-slate-900">
              <span className="text-xs">Net Take-Home:</span>
              <span className="font-mono text-sm text-blue-700">₹ {(latestSlip?.net || 164500).toLocaleString("en-IN")}</span>
            </div>
          </div>

          <Link
            to="/payroll/payslips"
            className="w-full h-8 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            View & Download Payslip
          </Link>
        </div>

        {/* My Hardware & Belongings */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-800">
              Company Assets Issued
            </h3>
            <p className="text-[10.5px] text-slate-400">Assigned corporate equipment</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Laptop className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-slate-800 text-xs truncate">Apple MacBook Pro 16&quot; M3</div>
                <div className="text-[10px] text-slate-400 font-mono">AST-LPT-2024-01</div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-slate-800 text-xs truncate">Building RFID Smart Badge</div>
                <div className="text-[10px] text-slate-400 font-mono">RFID-BLR-0492</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeePortal;
