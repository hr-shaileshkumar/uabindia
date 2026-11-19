import React from "react";
import { ArrowRightLeft, Sparkles, TrendingUp, MapPin } from "lucide-react";
import DynamicHrmsPage from "../../components/common/DynamicHrmsPage";

export const LifecycleManagement = () => {
  return (
    <div className="space-y-4">
      {/* Overview Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Promotions MTD</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">3 Staff Upgraded</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Inter-Branch Transfers</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">2 Station Moves</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Deputations Active</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">1 Onsite Deputed</div>
          </div>
        </div>
      </div>

      <DynamicHrmsPage pageKey="hrms.lifecycle" />
    </div>
  );
};

export default LifecycleManagement;
