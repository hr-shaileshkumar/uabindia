import apiClient from "@/services/apiClient";

export const reportsApi = {
  hr: {
    headcount: () => apiClient.get("/reports/hr/headcount"),
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
};
