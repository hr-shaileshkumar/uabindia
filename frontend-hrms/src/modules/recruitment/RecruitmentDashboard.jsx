import React from "react";
import { Link } from "react-router-dom";
import { UserCheck, Sparkles, TrendingUp, Calendar, FileCheck } from "lucide-react";
import DynamicHrmsPage from "../../components/common/DynamicHrmsPage";

export const RecruitmentDashboard = () => {
  return (
    <div className="space-y-4">
      {/* ATS Pipeline Launch Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-blue-300 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight flex items-center gap-1.5">
              <span>Candidate ATS Pipeline Kanban</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h3>
            <p className="text-xs text-blue-200/80 mt-0.5">
              Visual drag-and-advance pipeline from Screening to Tech Rounds, Leadership Evaluation, and Final Offer.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/screening-schedule"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            Interviews
          </Link>
          <Link
            to="/candidates"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            Open ATS Kanban
          </Link>
        </div>
      </div>

      <DynamicHrmsPage pageKey="hrms.recruitment" />
    </div>
  );
};

export default RecruitmentDashboard;
