import React from "react";
import { Link } from "react-router-dom";
import { UserCheck, ShieldCheck } from "lucide-react";
import DynamicHrmsPage from "../../components/common/DynamicHrmsPage";

export const EmployeeDirectory = () => {
  return (
    <div className="space-y-3">
      {/* Banner shortcut to 360 Dossier */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50/80 via-slate-50 to-white border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs shadow-blue-500/20">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>Employee 360 Comprehensive Dossier</span>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            </h4>
            <p className="text-[10.5px] text-slate-500">
              Access in-depth personnel profiles with CTC breakdowns, monthly attendance records, and timeline movements.
            </p>
          </div>
        </div>
        <Link
          to="/employees/360"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-2xs transition-colors shrink-0"
        >
          Open 360 Dossier
        </Link>
      </div>

      <DynamicHrmsPage pageKey="hrms.employees" />
    </div>
  );
};

export default EmployeeDirectory;
