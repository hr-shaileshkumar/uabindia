import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Clock,
  Calendar,
  Briefcase,
  TrendingUp,
  CreditCard,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Sparkles,
  Check,
  ChevronRight,
  FileText,
  FileCheck,
  Layers,
  ArrowUpRight,
  Filter,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import hrmsService from "../../services/hrmsService";
import { useNotification } from "../../context/NotificationContext";

export const HRDashboard = () => {
  const { user } = useAuth();
  const { notifySuccess } = useNotification();
  const navigate = useNavigate();

  // Active Scope Filter Tab in page header
  const [activeScope, setActiveScope] = useState("all");
  const [hoveredHour, setHoveredHour] = useState(null);

  const [stats, setStats] = useState({
    totalEmployees: 420,
    activeEmployees: 382,
    presentToday: 364,
    onLeaveToday: 18,
    openRequisitions: 24,
    monthlyPayroll: "₹45.1L",
    attendanceRate: "95.4%",
  });

  useEffect(() => {
    let mounted = true;
    hrmsService.getDashboardSummary().then((data) => {
      if (mounted && data) {
        setStats((prev) => ({
          ...prev,
          ...data,
        }));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Hourly Workforce Shift Inflow Telemetry (08:00 to 20:00)
  const hourlyPunches = [
    { hour: "08:00", inCount: 42, outCount: 4 },
    { hour: "09:00", inCount: 186, outCount: 8 },
    { hour: "10:00", inCount: 94, outCount: 12 },
    { hour: "12:00", inCount: 18, outCount: 32 },
    { hour: "14:00", inCount: 22, outCount: 16 },
    { hour: "17:00", inCount: 6, outCount: 148 },
    { hour: "19:00", inCount: 4, outCount: 112 },
  ];

  // SVG Chart Dimensions
  const svgWidth = 650;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingTop = 20;
  const paddingBottom = 35;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingTop - paddingBottom;
  const maxY = 200;

  const getX = (index) => paddingX + (index / (hourlyPunches.length - 1)) * chartW;
  const getY = (val) => paddingTop + chartH - (val / maxY) * chartH;

  // Bezier curve path generator
  const createSmoothPath = (dataKey) => {
    return hourlyPunches.reduce((acc, curr, i, arr) => {
      const x = getX(i);
      const y = getY(curr[dataKey]);
      if (i === 0) return `M ${x} ${y}`;
      const prevX = getX(i - 1);
      const prevY = getY(arr[i - 1][dataKey]);
      const cp1x = prevX + (x - prevX) / 2;
      const cp1y = prevY;
      const cp2x = prevX + (x - prevX) / 2;
      const cp2y = y;
      return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
    }, "");
  };

  const checkInPath = createSmoothPath("inCount");
  const checkOutPath = createSmoothPath("outCount");

  // Departmental Headcount Distribution
  const departmentStrength = [
    { name: "Engineering", count: 168, activePct: 98, color: "bg-blue-600" },
    { name: "Operations", count: 94, activePct: 96, color: "bg-indigo-600" },
    { name: "Sales & BD", count: 62, activePct: 91, color: "bg-sky-500" },
    { name: "Finance", count: 34, activePct: 100, color: "bg-emerald-600" },
    { name: "Product & UI", count: 24, activePct: 95, color: "bg-purple-600" },
  ];

  // Live Biometric Feeds
  const liveFeeds = [
    { id: 1, name: "Vikramaditya Singh", code: "EMP-1003", time: "11:42 AM", gate: "Turnstile Gate #02", type: "In", status: "Verified" },
    { id: 2, name: "Kavita Iyer", code: "EMP-1006", time: "11:38 AM", gate: "Turnstile Gate #01", type: "In", status: "Verified" },
    { id: 3, name: "Rohan Gupta", code: "EMP-1004", time: "11:15 AM", gate: "Visitor Terminal #03", type: "Out", status: "Break" },
    { id: 4, name: "Sneha Reddy", code: "EMP-1007", time: "10:52 AM", gate: "Turnstile Gate #01", type: "In", status: "Verified" },
  ];

  return (
    <div className="space-y-4">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/70">
              Workforce Intelligence
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">
              Uabindia Enterprise Ltd • Q3 FY 2026-27
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Workforce Operations Cockpit
          </h1>
          <p className="text-xs text-slate-500">
            Real-time biometric attendance telemetry, shift compliance, and workforce roster status.
          </p>
        </div>

        {/* Scope Segmentation Pills */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/80 self-start sm:self-center">
          {[
            { id: "all", label: "All Units" },
            { id: "eng", label: "Engineering" },
            { id: "ops", label: "Operations" },
            { id: "sales", label: "Sales & Field" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveScope(tab.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                activeScope === tab.id
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 High-Density KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Active Headcount */}
        <div className="hrms-card p-3 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold text-slate-600">Active Headcount</span>
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 leading-tight">
            {stats.activeEmployees}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-[10.5px]">
            <span className="font-semibold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200/60">
              +12 Q3 net
            </span>
            <span className="text-slate-400 font-mono">/ {stats.totalEmployees} enrolled</span>
          </div>
        </div>

        {/* KPI 2: Today's Shift Presence */}
        <div className="hrms-card p-3 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold text-slate-600">Shift Presence Rate</span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 leading-tight">
            {stats.attendanceRate}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-[10.5px]">
            <span className="text-slate-700 font-semibold">{stats.presentToday} Checked-in</span>
            <span className="text-slate-400 font-mono">• 18 late punch</span>
          </div>
        </div>

        {/* KPI 3: On Leave / Absence */}
        <div className="hrms-card p-3 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold text-slate-600">Scheduled Leaves</span>
            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 leading-tight">
            {stats.onLeaveToday}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-[10.5px]">
            <span className="text-slate-700 font-semibold">14 Planned PL</span>
            <span className="text-slate-400 font-mono">• 4 Medical SL</span>
          </div>
        </div>

        {/* KPI 4: Talent Acquisition Pipeline */}
        <div className="hrms-card p-3 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold text-slate-600">ATS Active Requisitions</span>
            <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 leading-tight">
            {stats.openRequisitions}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-[10.5px]">
            <span className="font-semibold text-blue-600 bg-blue-50 px-1 py-0.2 rounded border border-blue-200/60">
              6 at Offer Stage
            </span>
            <span className="text-slate-400 font-mono">• 142 in screening</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Dual-Curve Inflow Telemetry & Department Strength */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Left: Real-time Shift Inflow Telemetry Chart */}
        <div className="lg:col-span-2 hrms-card p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900">
                  Shift Inflow & Exit Telemetry
                </h3>
                <span className="text-[9.5px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Live
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400">
                Hourly biometric punch volume across enterprise turnstiles (08:00 - 20:00)
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-[10.5px] font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-slate-600">Duty Check-Ins</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-slate-600">Duty Exits</span>
              </div>
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              {/* Grid Lines */}
              {[0, 50, 100, 150, 200].map((val) => {
                const y = getY(val);
                return (
                  <g key={val}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      className="text-[9.5px] fill-slate-400 font-mono"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* X-axis labels */}
              {hourlyPunches.map((item, i) => (
                <text
                  key={i}
                  x={getX(i)}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-400 font-mono font-medium"
                >
                  {item.hour}
                </text>
              ))}

              {/* Check-Out Curve (Slate-400) */}
              <path
                d={checkOutPath}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Check-In Curve (Sapphire Blue #2563eb) */}
              <path
                d={checkInPath}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Data Points */}
              {hourlyPunches.map((item, i) => {
                const x = getX(i);
                const yIn = getY(item.inCount);
                const yOut = getY(item.outCount);
                const isHovered = hoveredHour === i;

                return (
                  <g key={i}>
                    {/* Hover vertical guide line */}
                    {isHovered && (
                      <line
                        x1={x}
                        y1={paddingTop}
                        x2={x}
                        y2={svgHeight - paddingBottom}
                        stroke="#cbd5e1"
                        strokeDasharray="2 2"
                        strokeWidth="1"
                      />
                    )}

                    {/* In Dot */}
                    <circle
                      cx={x}
                      cy={yIn}
                      r={isHovered ? 4.5 : 3}
                      className="fill-blue-600 stroke-white stroke-2 cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredHour(i)}
                      onMouseLeave={() => setHoveredHour(null)}
                    />

                    {/* Out Dot */}
                    <circle
                      cx={x}
                      cy={yOut}
                      r={isHovered ? 4 : 2.5}
                      className="fill-slate-500 stroke-white stroke-2 cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredHour(i)}
                      onMouseLeave={() => setHoveredHour(null)}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right: Departmental Headcount & Strength */}
        <div className="hrms-card p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Departmental Strength
                </h3>
                <p className="text-[10.5px] text-slate-400">Roster distribution by business unit</p>
              </div>
              <Link
                to="/employees"
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                View Roster →
              </Link>
            </div>

            <div className="space-y-2.5">
              {departmentStrength.map((dept) => (
                <div key={dept.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{dept.name}</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {dept.count} <span className="text-[10px] text-slate-400 font-normal">({dept.activePct}% present)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${dept.color} rounded-full transition-all duration-300`}
                      style={{ width: `${(dept.count / 180) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total Campus Headcount:</span>
            <span className="font-mono font-bold text-slate-800">382 On Roster</span>
          </div>
        </div>
      </div>

      {/* Bottom 3-Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Shift Adherence */}
        <div className="hrms-card p-3.5 space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900">Shift Adherence Telemetry</h3>
            <p className="text-[10.5px] text-slate-400">Current active work shifts</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800">Morning Shift (09:00 - 18:00)</div>
                <div className="text-[10px] text-slate-400">286 personnel active</div>
              </div>
              <span className="font-mono font-bold text-blue-600">96.8%</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800">Evening Shift (14:00 - 23:00)</div>
                <div className="text-[10px] text-slate-400">74 personnel rostered</div>
              </div>
              <span className="font-mono font-bold text-emerald-600">94.2%</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800">Night Operations (22:00 - 07:00)</div>
                <div className="text-[10px] text-slate-400">22 personnel standby</div>
              </div>
              <span className="font-mono font-bold text-indigo-600">100%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Immediate HR Action Items */}
        <div className="hrms-card p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900">Pending Authorizations</h3>
              <p className="text-[10.5px] text-slate-400">Items awaiting HR sign-off</p>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              4 Action Items
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <Link
              to="/leave"
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-100 flex items-center justify-between transition-colors group"
            >
              <div className="min-w-0">
                <div className="font-semibold text-slate-800 text-xs group-hover:text-blue-600 transition-colors">
                  Review 3 Leave Applications
                </div>
                <div className="text-[10px] text-slate-400">Awaiting manager/HR sanction</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
            </Link>

            <Link
              to="/attendance/muster"
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-100 flex items-center justify-between transition-colors group"
            >
              <div className="min-w-0">
                <div className="font-semibold text-slate-800 text-xs group-hover:text-blue-600 transition-colors">
                  Verify Form 25 Muster Roll
                </div>
                <div className="text-[10px] text-slate-400">November statutory sign-off</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
            </Link>

            <Link
              to="/payroll"
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-100 flex items-center justify-between transition-colors group"
            >
              <div className="min-w-0">
                <div className="font-semibold text-slate-800 text-xs group-hover:text-blue-600 transition-colors">
                  Confirm Salary Batch PR-2026-11
                </div>
                <div className="text-[10px] text-slate-400">Disbursement checklist ready</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
            </Link>
          </div>
        </div>

        {/* Card 3: Live Biometric Punch Stream */}
        <div className="hrms-card p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900">Live Biometric Stream</h3>
              <p className="text-[10.5px] text-slate-400">Real-time gate ingest events</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {liveFeeds.map((feed) => (
              <div
                key={feed.id}
                className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 text-xs truncate">
                    {feed.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {feed.code} • {feed.gate}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10.5px] font-bold font-mono text-slate-700">
                    {feed.time}
                  </div>
                  <span
                    className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      feed.type === "In"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    Punch {feed.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
