import { useQuery } from "@tanstack/react-query";
import { appApi, hrmsApi } from "@/services/modules";
import type { DashboardStats } from "@/types";

type ApprovalRow = {
  id: string;
  moduleKey?: string;
  entityType?: string;
  status?: string;
  requestedAt?: string;
};

type LeaveApprovalRow = {
  id?: string;
  employeeName?: string;
  leaveType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
};

const parseEmployeesPayload = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.employees)) return obj.employees;
    if (Array.isArray(obj.data)) return obj.data;
  }
  return [];
};

export const mssDashboardQueryKey = ["hrms", "mss-dashboard"] as const;

export const useMssDashboard = () =>
  useQuery({
    queryKey: mssDashboardQueryKey,
    queryFn: async () => {
      const [statsRes, workflowRes, leaveRes] = await Promise.all([
        hrmsApi.dashboard.getStats().catch(() => ({ data: null as DashboardStats | null })),
        appApi.approvals.list("Pending").catch(() => ({ data: [] as ApprovalRow[] })),
        hrmsApi.hrms.leave.approvals.list("Pending").catch(() => ({ data: [] as LeaveApprovalRow[] })),
      ]);

      const workflowApprovals = Array.isArray(workflowRes.data) ? workflowRes.data : [];
      const leaveApprovalsRaw = leaveRes.data;
      const leaveApprovals = Array.isArray(leaveApprovalsRaw)
        ? leaveApprovalsRaw
        : Array.isArray((leaveApprovalsRaw as { data?: LeaveApprovalRow[] })?.data)
          ? (leaveApprovalsRaw as { data: LeaveApprovalRow[] }).data
          : [];

      return {
        stats: statsRes.data,
        workflowApprovals: workflowApprovals as ApprovalRow[],
        leaveApprovals: leaveApprovals as LeaveApprovalRow[],
      };
    },
    staleTime: 30_000,
  });

export const parseEmployeeList = (raw: unknown) => parseEmployeesPayload(raw);
