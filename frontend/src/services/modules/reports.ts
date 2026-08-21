import apiClient from "@/services/apiClient";

export type ReportsDashboardSummary = {
  hr?: {
    totalEmployees?: number;
    activeEmployees?: number;
    todayAttendance?: number;
    pendingLeaves?: number;
  };
  payroll?: {
    thisMonthRuns?: number;
    totalPayout?: number;
  };
  timestamp?: string;
};

export const reportsApi = {
  dashboard: () => apiClient.get<ReportsDashboardSummary>("/reports/dashboard"),
  hr: {
    headcount: () => apiClient.get("/reports/hr/headcount"),
    headcountByDepartment: () => apiClient.get("/reports/hr/headcount-by-department"),
    attendance: () => apiClient.get("/reports/hr/attendance-summary"),
    leave: (year?: number) => apiClient.get(`/reports/hr/leave-summary${year ? `?year=${year}` : ""}`),
    turnover: () => apiClient.get("/reports/hr/turnover"),
    projectCompare: (params?: { companyId?: string; projectIds?: string[]; fromDate?: string; toDate?: string }) => {
      const query = new URLSearchParams();
      if (params?.companyId) query.append("companyId", params.companyId);
      if (params?.projectIds?.length) {
        params.projectIds.forEach((id) => query.append("projectIds", id));
      }
      if (params?.fromDate) query.append("fromDate", params.fromDate);
      if (params?.toDate) query.append("toDate", params.toDate);
      const suffix = query.toString() ? `?${query}` : "";
      return apiClient.get(`/reports/hr/project-compare${suffix}`, { headers: { "X-Silent-Error": "1" } });
    },
  },
  payroll: {
    overview: () => apiClient.get("/reports/payroll/overview"),
    monthly: (year?: number) => apiClient.get(`/reports/payroll/monthly${year ? `?year=${year}` : ""}`),
    components: () => apiClient.get("/reports/payroll/components"),
    structures: () => apiClient.get("/reports/payroll/structures"),
  },
  compliance: {
    auditLog: (fromDate?: string, toDate?: string) => {
      const query = new URLSearchParams();
      if (fromDate) query.append("fromDate", fromDate);
      if (toDate) query.append("toDate", toDate);
      const suffix = query.toString() ? `?${query}` : "";
      return apiClient.get(`/reports/compliance/audit-log${suffix}`);
    },
    dataQuality: () => apiClient.get("/reports/compliance/data-quality"),
    moduleUsage: () => apiClient.get("/reports/compliance/module-usage"),
  },
  custom: {
    list: () => apiClient.get("/reports/custom"),
    create: (data: Record<string, unknown>) => apiClient.post("/reports/custom", data),
    update: (id: string, data: Record<string, unknown>) => apiClient.put(`/reports/custom/${id}`, data),
    run: (id: string) => apiClient.post(`/reports/custom/${id}/run`, {}),
    activate: (id: string) => apiClient.post(`/reports/custom/${id}/activate`, {}),
    delete: (id: string) => apiClient.delete(`/reports/custom/${id}`),
  },
  finance: {
    trialBalance: () => apiClient.get("/reports/finance/trial-balance"),
    profitAndLoss: (from?: string, to?: string) => {
      const q = new URLSearchParams();
      if (from) q.append("from", from);
      if (to) q.append("to", to);
      const suffix = q.toString() ? `?${q}` : "";
      return apiClient.get(`/reports/finance/profit-and-loss${suffix}`);
    },
    balanceSheet: () => apiClient.get("/reports/finance/balance-sheet"),
    ageing: () => apiClient.get("/reports/finance/ageing"),
  },
};
