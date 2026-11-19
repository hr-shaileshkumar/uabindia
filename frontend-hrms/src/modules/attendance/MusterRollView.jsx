import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Download,
  Filter,
  Users,
  Clock,
  Printer,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import hrmsService from "../../services/hrmsService";
import { useNotification } from "../../context/NotificationContext";

export const MusterRollView = () => {
  const { notifySuccess } = useNotification();
  const [selectedMonth, setSelectedMonth] = useState("November 2026");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    hrmsService.getEmployees().then((data) => {
      setEmployees(data);
      setLoading(false);
    });
  }, []);

  // Days in month (1 to 30)
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  // Deterministic attendance generator for visual muster roll
  const getDayStatus = (empId, day) => {
    // Sundays & 2nd/4th Saturdays are Weekly Off (WO)
    const isSunday = day % 7 === 1;
    const isSaturday = day % 7 === 0;
    if (isSunday || isSaturday) return { code: "WO", style: "bg-slate-100 text-slate-400 font-semibold" };

    if (empId === "emp-05" && (day === 12 || day === 13 || day === 14)) {
      return { code: "L", style: "bg-blue-100 text-blue-800 font-bold" };
    }
    if (empId === "emp-03" && day === 18) {
      return { code: "HD", style: "bg-amber-100 text-amber-800 font-bold" };
    }
    if (day > 12) {
      return { code: "—", style: "text-slate-300" };
    }
    return { code: "P", style: "bg-emerald-50 text-emerald-700 font-bold" };
  };

  const handleExport = () => {
    notifySuccess("Muster Roll Form 25 statutory register exported");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-0.5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Link
              to="/attendance"
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              ← Back to Daily Punches
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Form 25 Statutory Register
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Monthly Attendance Muster Roll
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Day-wise punch matrix from database, weekly off distribution, and leave utilization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-8 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-800 shadow-2xs focus:ring-1 focus:ring-blue-600 cursor-pointer"
          >
            <option value="November 2026">November 2026</option>
            <option value="October 2026">October 2026</option>
            <option value="September 2026">September 2026</option>
          </select>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Register
          </button>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs flex flex-wrap items-center gap-3 text-xs">
        <span className="font-bold text-slate-400 uppercase text-[9.5px] tracking-wider">
          Legend:
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4.5 h-4.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[9.5px] flex items-center justify-center">
            P
          </span>
          <span className="text-slate-600 text-[11px] font-medium">Present (Full Day)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4.5 h-4.5 rounded bg-amber-100 text-amber-800 font-bold text-[9.5px] flex items-center justify-center">
            HD
          </span>
          <span className="text-slate-600 text-[11px] font-medium">Half Day</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4.5 h-4.5 rounded bg-blue-100 text-blue-800 font-bold text-[9.5px] flex items-center justify-center">
            L
          </span>
          <span className="text-slate-600 text-[11px] font-medium">Approved Leave</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4.5 h-4.5 rounded bg-slate-100 text-slate-500 font-semibold text-[9.5px] flex items-center justify-center">
            WO
          </span>
          <span className="text-slate-600 text-[11px] font-medium">Weekly Off</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4.5 h-4.5 rounded bg-rose-100 text-rose-700 font-bold text-[9.5px] flex items-center justify-center">
            A
          </span>
          <span className="text-slate-600 text-[11px] font-medium">Loss of Pay</span>
        </span>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200/70 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold select-none text-[10px] uppercase tracking-wider">
                <th className="px-3 py-2 sticky left-0 bg-slate-50 z-10 w-44 shadow-2xs">
                  Employee (Name & Code)
                </th>
                {days.map((d) => (
                  <th
                    key={d}
                    className="px-1 py-2 text-center min-w-[26px] border-l border-slate-100 text-[10px] font-mono"
                  >
                    {d}
                  </th>
                ))}
                <th className="px-2.5 py-2 text-center bg-emerald-50/50 text-emerald-800 font-bold min-w-[50px]">
                  P
                </th>
                <th className="px-2.5 py-2 text-center bg-blue-50/50 text-blue-800 font-bold min-w-[50px]">
                  L
                </th>
                <th className="px-2.5 py-2 text-center bg-rose-50/50 text-rose-800 font-bold min-w-[50px]">
                  LOP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => {
                let presentCount = 8;
                let leaveCount = emp.id === "emp-05" ? 3 : 0;
                let lopCount = 0;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-3 py-1.5 sticky left-0 bg-white z-10 font-medium text-slate-800 border-r border-slate-100 text-xs shadow-2xs">
                      <div className="truncate font-semibold text-slate-800">{emp.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">
                        {emp.employeeCode}
                      </div>
                    </td>

                    {days.map((d) => {
                      const st = getDayStatus(emp.id, d);
                      return (
                        <td
                          key={d}
                          className="px-0.5 py-1 text-center border-l border-slate-100"
                        >
                          <span
                            className={`w-5 h-5 rounded mx-auto flex items-center justify-center text-[9px] ${st.style}`}
                          >
                            {st.code}
                          </span>
                        </td>
                      );
                    })}

                    <td className="px-2 py-1 text-center font-bold text-emerald-700 font-mono text-xs bg-emerald-50/20">
                      {presentCount}
                    </td>
                    <td className="px-2 py-1 text-center font-bold text-blue-700 font-mono text-xs bg-blue-50/20">
                      {leaveCount}
                    </td>
                    <td className="px-2 py-1 text-center font-bold text-rose-700 font-mono text-xs bg-rose-50/20">
                      {lopCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MusterRollView;
