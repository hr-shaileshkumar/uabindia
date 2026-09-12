import { useQuery } from "@tanstack/react-query";
import { appApi, hrmsApi } from "@/services/modules";
import type { DashboardStats } from "@/types";

export type ApprovalRow = {
  id: string;
  moduleKey?: string;
  entityType?: string;
  status?: string;
  requestedAt?: string;
};

export type LeaveApprovalRow = {
  id?: string;
  employeeId?: string;
  employeeName?: string;
  leaveType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  reason?: string;
};

export type MyTeamMember = {
  id: string;
  fullName: string;
  employeeCode?: string;
  designation?: string;
  department?: string;
  workEmail?: string;
  phone?: string;
  dateOfJoining?: string;
  status: string;
  todayAttendanceStatus: "Present" | "On Leave" | "Not Checked In";
  firstPunchInTime?: string;
  leaveBalance: number;
};

export type MyTeamData = {
  managerId: string;
  managerName: string;
  managerCode?: string;
  managerDesignation?: string;
  totalTeamMembers: number;
  presentToday: number;
  onLeaveToday: number;
  notCheckedInToday: number;
  pendingApprovalsCount: number;
  teamMembers: MyTeamMember[];
  pendingLeaves: LeaveApprovalRow[];
};

export const mssDashboardQueryKey = ["hrms", "mss-dashboard"] as const;

export const useMssDashboard = () =>
  useQuery({
    queryKey: mssDashboardQueryKey,
    queryFn: async () => {
      const [myTeamRes, workflowRes] = await Promise.all([
        hrmsApi.organization.getMyTeam().catch(() => ({ data: null as MyTeamData | null })),
        appApi.approvals.list("Pending").catch(() => ({ data: [] as ApprovalRow[] })),
      ]);

      const myTeam = myTeamRes.data as MyTeamData | null;
      const workflowApprovals = Array.isArray(workflowRes.data) ? (workflowRes.data as ApprovalRow[]) : [];

      // Format team leaves as LeaveApprovalRow
      const teamLeaves: LeaveApprovalRow[] = (myTeam?.pendingLeaves ?? []).map((l: any) => ({
        id: l.id,
        employeeId: l.employeeId,
        employeeName: l.employeeName ?? "Team Member",
        leaveType: l.leavePolicyName ?? "Leave",
        status: l.status ?? "Pending",
        startDate: l.fromDate,
        endDate: l.toDate,
        days: l.days,
        reason: l.reason,
      }));

      return {
        myTeam,
        teamMembers: myTeam?.teamMembers ?? [],
        teamStats: {
          total: myTeam?.totalTeamMembers ?? 0,
          presentToday: myTeam?.presentToday ?? 0,
          onLeaveToday: myTeam?.onLeaveToday ?? 0,
          notCheckedInToday: myTeam?.notCheckedInToday ?? 0,
          pendingApprovals: (myTeam?.pendingApprovalsCount ?? 0) + workflowApprovals.length,
        },
        managerInfo: {
          name: myTeam?.managerName ?? "Manager",
          code: myTeam?.managerCode,
          designation: myTeam?.managerDesignation ?? "Team Lead",
        },
        workflowApprovals,
        leaveApprovals: teamLeaves,
      };
    },
    staleTime: 15_000,
  });

