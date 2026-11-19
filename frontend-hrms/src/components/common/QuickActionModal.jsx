import React from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  UserPlus,
  Calendar,
  Clock,
  Briefcase,
  CreditCard,
  ArrowRightLeft,
  ArrowRight,
} from "lucide-react";

export const QuickActionModal = ({ isOpen, onClose, onActionSelect }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const actions = [
    {
      id: "new-employee",
      title: "Add New Employee",
      desc: "Enroll workforce joiner with personal, job, and statutory master details.",
      icon: UserPlus,
      color: "bg-indigo-50 text-indigo-600",
      path: "/employees?action=create",
    },
    {
      id: "apply-leave",
      title: "Apply for Leave",
      desc: "Submit casual, sick, or earned leave request with duration calculation.",
      icon: Calendar,
      color: "bg-amber-50 text-amber-600",
      path: "/leave?action=create",
    },
    {
      id: "clock-punch",
      title: "Clock In / Mark Punch",
      desc: "Record biometric/geofenced duty punch with GPS coordinates verification.",
      icon: Clock,
      color: "bg-emerald-50 text-emerald-600",
      path: "/attendance?action=punch",
    },
    {
      id: "post-job",
      title: "Create Job Opening",
      desc: "Open talent requisition, vacancy requirements, and compensation band.",
      icon: Briefcase,
      color: "bg-blue-50 text-blue-600",
      path: "/recruitment?action=create",
    },
    {
      id: "payroll-run",
      title: "Execute Payroll Run",
      desc: "Initiate 4-step monthly salary batch calculation and compliance audit.",
      icon: CreditCard,
      color: "bg-purple-50 text-purple-600",
      path: "/payroll?action=run",
    },
    {
      id: "movement",
      title: "Workforce Movement",
      desc: "Propose employee promotion, branch transfer, or deputation order.",
      icon: ArrowRightLeft,
      color: "bg-pink-50 text-pink-600",
      path: "/lifecycle?action=create",
    },
  ];

  const handleSelect = (action) => {
    onClose();
    if (onActionSelect) onActionSelect(action.id);
    navigate(action.path);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Quick HR Actions</h3>
            <p className="text-xs text-slate-500 mt-0.5">Select a common operation to initiate immediately.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => handleSelect(act)}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-slate-50/80 text-left transition-all group"
              >
                <div className={`p-2.5 rounded-xl ${act.color} shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                    {act.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuickActionModal;
