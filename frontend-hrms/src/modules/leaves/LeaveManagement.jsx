import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import DynamicHrmsPage from "../../components/common/DynamicHrmsPage";

export const LeaveManagement = () => {
  return (
    <div className="space-y-3">
      {/* Leave Balance Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
              Casual Leave (CL)
            </span>
            <span className="text-xs font-bold text-emerald-600">8 / 12 Left</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "66%" }} />
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>4 Days Availed</span>
            <span>Annual Quota: 12</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
              Sick Leave (SL)
            </span>
            <span className="text-xs font-bold text-blue-600">10 / 10 Left</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: "100%" }} />
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>0 Days Availed</span>
            <span>Annual Quota: 10</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
              Privilege Leave (PL)
            </span>
            <span className="text-xs font-bold text-amber-600">15 / 18 Left</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: "83%" }} />
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>3 Days Availed</span>
            <span>Carry-Forward Eligible</span>
          </div>
        </div>
      </div>

      <DynamicHrmsPage pageKey="hrms.leave" />
    </div>
  );
};

export default LeaveManagement;
