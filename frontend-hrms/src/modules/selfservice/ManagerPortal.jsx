import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import hrmsService from "../../services/hrmsService";
import { useNotification } from "../../context/NotificationContext";
import StatusBadge from "../../components/common/StatusBadge";

export const ManagerPortal = () => {
  const { user } = useAuth();
  const { notifySuccess, notifyError } = useNotification();
  const [leaves, setLeaves] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([hrmsService.getLeaves(), hrmsService.getEmployees()]).then(
      ([leaveData, empData]) => {
        if (mounted) {
          setLeaves(leaveData || []);
          const allEmps = empData || [];
          const reports = allEmps.filter(
            (e) =>
              e.departmentName === "Engineering" ||
              e.managerName === "Aarav Sharma" ||
              e.managerName === user?.fullName
          );
          setTeamMembers(reports.length > 0 ? reports : allEmps.slice(0, 5));
          setLoading(false);
        }
      }
    );
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleApproveLeave = async (id, name) => {
    try {
      await hrmsService.updateLeaveStatus(id, "Approved");
      setLeaves((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "Approved" } : l))
      );
      notifySuccess(`Leave request for ${name} approved`);
    } catch (e) {
      notifyError("Failed to approve leave request");
    }
  };

  const handleRejectLeave = async (id, name) => {
    try {
      await hrmsService.updateLeaveStatus(id, "Rejected");
      setLeaves((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "Rejected" } : l))
      );
      notifySuccess(`Leave request for ${name} rejected`);
    } catch (e) {
      notifyError("Failed to reject leave request");
    }
  };

  const pendingLeaves = leaves.filter((l) => l.status === "Pending");

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-blue-400 px-2 py-0.5 rounded-full bg-white/10">
            Manager Self-Service (MSS)
          </span>
          <h1 className="text-base sm:text-lg font-bold mt-0.5 text-white">
            Team Leadership Cockpit
          </h1>
          <p className="text-xs text-slate-300">
            Manage your direct reports, pending absence applications, timesheets, and team members.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-2.5 px-3.5 rounded-xl bg-white/10 text-center border border-white/10">
            <div className="text-[9.5px] text-slate-300 uppercase font-bold tracking-wider">Direct Reports</div>
            <div className="text-base font-bold font-mono text-white">{teamMembers.length} Staff</div>
          </div>
          <div className="p-2.5 px-3.5 rounded-xl bg-white/10 text-center border border-white/10">
            <div className="text-[9.5px] text-slate-300 uppercase font-bold tracking-wider">Pending Action</div>
            <div className="text-base font-bold font-mono text-amber-400">
              {pendingLeaves.length}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Pending Team Leaves & Team Presence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Pending Leave Approvals */}
        <div className="lg:col-span-2 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-800">
                Absence & Leave Approvals Inbox
              </h3>
              <p className="text-[10.5px] text-slate-400">
                Applications submitted by your direct report employees
              </p>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {pendingLeaves.length} Pending
            </span>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Loading team absence requests from database...
              </div>
            ) : leaves.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No leave requests found.
              </div>
            ) : (
              leaves.slice(0, 5).map((leave) => (
                <div
                  key={leave.id}
                  className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-bold text-slate-900">{leave.employeeName}</span>
                      <StatusBadge status={leave.status} />
                    </div>
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">{leave.leaveTypeName}</span> •{" "}
                      <span className="font-mono text-slate-500">
                        {leave.fromDate} to {leave.toDate} ({leave.days} day{leave.days > 1 ? "s" : ""})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 italic truncate mt-0.5">
                      &ldquo;{leave.reason}&rdquo;
                    </p>
                  </div>

                  {leave.status === "Pending" ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRejectLeave(leave.id, leave.employeeName)}
                        className="h-7 px-2.5 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <XCircle className="w-3 h-3" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveLeave(leave.id, leave.employeeName)}
                        className="h-7 px-2.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Approve
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono italic">
                      Processed
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Team Members List */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-800">
                Direct Team Roster
              </h3>
              <p className="text-[10.5px] text-slate-400">Reporting employees</p>
            </div>
            <Link
              to="/employees"
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 hover:underline"
            >
              All
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2 text-xs">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={
                      member.avatarUrl ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                    }
                    alt={member.fullName}
                    className="w-7 h-7 rounded-md object-cover ring-1 ring-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 text-xs truncate">
                      {member.fullName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {member.designationName || member.departmentName}
                    </div>
                  </div>
                </div>

                <StatusBadge status={member.status || "Active"} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerPortal;
