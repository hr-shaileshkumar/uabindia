import apiClient from "@/services/apiClient";
import type { DashboardStats, LeaveRequestsResponse } from "@/types";
import type { ApiPayload } from "./shared";

export const hrmsApi = {
  dashboard: {
    getStats: () => apiClient.get<DashboardStats>("/hr/dashboard"),
  },
  hrms: {
    employees: {
      list: (page = 1, limit = 10, params?: { companyId?: string; projectId?: string; search?: string; status?: string; probation?: boolean }) => {
        const query = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (params?.companyId) query.append("companyId", params.companyId);
        if (params?.projectId) query.append("projectId", params.projectId);
        if (params?.search) query.append("search", params.search);
        if (params?.status) query.append("status", params.status);
        if (params?.probation) query.append("probation", "true");
        return apiClient.get(`/employees?${query}`);
      },
      getById: (id: string) => apiClient.get(`/employees/${id}`),
      getProfile360: (id: string) => apiClient.get(`/employees/${id}/profile-360`),
      create: (data: ApiPayload) => apiClient.post("/employees", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/employees/${id}`, data),
      delete: (id: string) => apiClient.delete(`/employees/${id}`),
    },
    organization: {
      getTree: (rootEmployeeId?: string, departmentId?: string) => {
        const query = new URLSearchParams();
        if (rootEmployeeId) query.append("rootEmployeeId", rootEmployeeId);
        if (departmentId) query.append("departmentId", departmentId);
        const qs = query.toString() ? `?${query.toString()}` : "";
        return apiClient.get(`/hrms/organization/tree${qs}`);
      },
      assignManager: (employeeId: string, payload: { reportingManagerId: string | null; reason?: string; effectiveDate?: string }) =>
        apiClient.post(`/hrms/organization/employees/${employeeId}/assign-manager`, payload),
      getChainOfCommand: (employeeId: string) =>
        apiClient.get(`/hrms/organization/employees/${employeeId}/chain-of-command`),
      getTransfers: (status?: string) => {
        const query = status ? `?status=${encodeURIComponent(status)}` : "";
        return apiClient.get(`/hrms/organization/transfers${query}`);
      },
      requestTransfer: (payload: {
        employeeId: string;
        proposedManagerId?: string | null;
        proposedDepartmentId?: string | null;
        transferType: string;
        reason: string;
        effectiveDate: string;
      }) => apiClient.post("/hrms/organization/transfers", payload),
      signOffTransfer: (id: string, payload: { role: string; decision: string; notes?: string }) =>
        apiClient.post(`/hrms/organization/transfers/${id}/sign-off`, payload),
      getOrphanRisks: () =>
        apiClient.get("/hrms/organization/orphan-risks"),
      reassignOrphans: (managerId: string, targetManagerId?: string) => {
        const qs = targetManagerId ? `?targetManagerId=${targetManagerId}` : "";
        return apiClient.post(`/hrms/organization/orphan-risks/${managerId}/reassign-to-skip-level${qs}`, {});
      },
      getDelegations: () =>
        apiClient.get("/hrms/organization/delegations"),
      delegateAuthority: (payload: { actingManagerId?: string | null; startDate?: string; endDate?: string; reason?: string }) =>
        apiClient.post("/hrms/organization/delegations", payload),
      revokeDelegation: (employeeId: string) =>
        apiClient.delete(`/hrms/organization/delegations/${employeeId}`),
    },
    attendance: {
      list: (page = 1, limit = 10, params?: { employeeId?: string }) => {
        const query = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (params?.employeeId) query.append("employeeId", params.employeeId);
        return apiClient.get(`/attendance?${query}`);
      },
      getById: (id: string) => apiClient.get(`/attendance/${id}`),
      markAttendance: (data: ApiPayload) => apiClient.post("/attendance/punch", data),
      punchMe: (data?: ApiPayload) => apiClient.post("/attendance/punch/me", data ?? {}),
      update: (id: string, data: ApiPayload) => apiClient.put(`/attendance/${id}`, data),
      delete: (id: string) => apiClient.delete(`/attendance/${id}`),
      getOccupancyRadar: () => apiClient.get("/attendance/analytics/occupancy"),
      getBradfordScores: () => apiClient.get("/attendance/analytics/bradford"),
      webCheckIn: (payload: { punchType?: string; latitude?: number | null; longitude?: number | null; deviceInfo?: string }) =>
        apiClient.post("/attendance/web-checkin", payload),
      biometric: {
        getDevices: () => apiClient.get("/hrms/biometric/devices"),
        heartbeat: (payload: { deviceId: string; firmwareVersion?: string; ipAddress?: string }) =>
          apiClient.post("/hrms/biometric/heartbeat", payload),
        pushPunches: (payload: {
          deviceId: string;
          punches: Array<{
            employeeCode?: string;
            enrollmentId?: string;
            timestamp: string;
            punchType?: string;
            deviceId?: string;
          }>;
        }) => apiClient.post("/hrms/biometric/push", payload),
      },
      policies: {
        list: (companyId?: string, projectId?: string) => {
          const q = new URLSearchParams();
          if (companyId) q.set("companyId", companyId);
          if (projectId) q.set("projectId", projectId);
          const qs = q.toString() ? `?${q}` : "";
          return apiClient.get(`/attendance/policies${qs}`);
        },
        getSchema: (companyId?: string, projectId?: string) => {
          const q = new URLSearchParams();
          if (companyId) q.set("companyId", companyId);
          if (projectId) q.set("projectId", projectId);
          const qs = q.toString() ? `?${q}` : "";
          return apiClient.get(`/attendance/policies/schema${qs}`);
        },
        getById: (id: string) => apiClient.get(`/attendance/policies/${id}`),
        getDefault: () => apiClient.get("/attendance/policies/default"),
        create: (data: ApiPayload) => apiClient.post("/attendance/policies", data),
        update: (id: string, data: ApiPayload) => apiClient.put(`/attendance/policies/${id}`, data),
        delete: (id: string) => apiClient.delete(`/attendance/policies/${id}`),
        setDefault: (id: string) => apiClient.post(`/attendance/policies/${id}/set-default`, {}),
      },
    },
    leave: {
      types: {
        list: () => apiClient.get("/leave/types"),
        create: (data: ApiPayload) => apiClient.post("/leave/types", data),
      },
      policies: {
        list: (companyId?: string, projectId?: string) => {
          const q = new URLSearchParams();
          if (companyId) q.set("companyId", companyId);
          if (projectId) q.set("projectId", projectId);
          const qs = q.toString() ? `?${q}` : "";
          return apiClient.get(`/leave/policies${qs}`);
        },
        getSchema: (companyId?: string, projectId?: string) => {
          const q = new URLSearchParams();
          if (companyId) q.set("companyId", companyId);
          if (projectId) q.set("projectId", projectId);
          const qs = q.toString() ? `?${q}` : "";
          return apiClient.get(`/leave/policies/schema${qs}`);
        },
        getById: (id: string) => apiClient.get(`/leave/policies/${id}`),
        getDefault: () => apiClient.get("/leave/policies/default"),
        create: (data: ApiPayload) => apiClient.post("/leave/policies", data),
        update: (id: string, data: ApiPayload) => apiClient.put(`/leave/policies/${id}`, data),
        delete: (id: string) => apiClient.delete(`/leave/policies/${id}`),
        setDefault: (id: string) => apiClient.post(`/leave/policies/${id}/set-default`, {}),
        rules: {
          list: (policyId: string) => apiClient.get(`/leave/policies/${policyId}/rules`),
          create: (policyId: string, data: ApiPayload) => apiClient.post(`/leave/policies/${policyId}/rules`, data),
        },
      },
      list: (page = 1, limit = 10) =>
        apiClient.get<LeaveRequestsResponse>(`/leave/requests?page=${page}&limit=${limit}`),
      getById: (id: string) => apiClient.get(`/leave/requests/${id}`),
      requestLeave: (data: ApiPayload) => apiClient.post("/leave/requests", data),
      approveLeave: (id: string) => apiClient.post(`/leave/requests/${id}/approve`, {}),
      rejectLeave: (id: string) => apiClient.post(`/leave/requests/${id}/reject`, {}),
      approvals: {
        list: (status = "Pending") => apiClient.get(`/leave/approvals?status=${status}`),
      },
      balances: {
        list: (employeeId?: string) => apiClient.get(`/leave/balances${employeeId ? `?employeeId=${employeeId}` : ""}`),
        mine: () => apiClient.get("/leave/balances/me"),
      },
      holidays: {
        list: (year?: number) => apiClient.get(`/leave/holidays${year ? `?year=${year}` : ""}`),
        create: (data: ApiPayload) => apiClient.post("/leave/holidays", data),
      },
      allocations: {
        list: (params?: { employeeId?: string; year?: number }) => {
          const query = new URLSearchParams();
          if (params?.employeeId) query.append("employeeId", params.employeeId);
          if (params?.year) query.append("year", params.year.toString());
          return apiClient.get(`/leave/allocations${query.toString() ? `?${query}` : ""}`);
        },
        create: (data: ApiPayload) => apiClient.post("/leave/allocations", data),
      },
    },
    overtime: {
      requests: {
        list: (params?: { skip?: number; take?: number }) => {
          const query = new URLSearchParams();
          if (typeof params?.skip === "number") query.append("skip", params.skip.toString());
          if (typeof params?.take === "number") query.append("take", params.take.toString());
          const suffix = query.toString() ? `?${query}` : "";
          return apiClient.get(`/overtime/requests${suffix}`);
        },
        getById: (id: string) => apiClient.get(`/overtime/requests/${id}`),
        byEmployee: (employeeId: string) => apiClient.get(`/overtime/requests/employee/${employeeId}`),
        pending: () => apiClient.get("/overtime/requests/pending"),
        create: (data: ApiPayload) => apiClient.post("/overtime/requests", data),
        update: (id: string, data: ApiPayload) => apiClient.put(`/overtime/requests/${id}`, data),
        delete: (id: string) => apiClient.delete(`/overtime/requests/${id}`),
      },
      approvals: {
        byRequest: (requestId: string) => apiClient.get(`/overtime/approvals/request/${requestId}`),
        pending: (approverId: string) => apiClient.get(`/overtime/approvals/pending/${approverId}`),
        create: (data: ApiPayload) => apiClient.post("/overtime/approvals", data),
      },
      logs: {
        list: (params?: { skip?: number; take?: number }) => {
          const query = new URLSearchParams();
          if (typeof params?.skip === "number") query.append("skip", params.skip.toString());
          if (typeof params?.take === "number") query.append("take", params.take.toString());
          const suffix = query.toString() ? `?${query}` : "";
          return apiClient.get(`/overtime/logs${suffix}`);
        },
        byEmployee: (employeeId: string) => apiClient.get(`/overtime/logs/employee/${employeeId}`),
        unprocessed: () => apiClient.get("/overtime/logs/unprocessed"),
        create: (data: ApiPayload) => apiClient.post("/overtime/logs", data),
      },
      statistics: {
        employee: (employeeId: string, params: { startDate: string; endDate: string }) =>
          apiClient.get(`/overtime/statistics/employee/${employeeId}?startDate=${encodeURIComponent(params.startDate)}&endDate=${encodeURIComponent(params.endDate)}`),
      },
    },
    probation: {
      policies: {
        list: (companyId?: string, projectId?: string) => {
          const q = new URLSearchParams();
          if (companyId) q.set("companyId", companyId);
          if (projectId) q.set("projectId", projectId);
          const qs = q.toString() ? `?${q}` : "";
          return apiClient.get(`/hrms/probation/policies${qs}`);
        },
        getSchema: (companyId?: string, projectId?: string) => {
          const q = new URLSearchParams();
          if (companyId) q.set("companyId", companyId);
          if (projectId) q.set("projectId", projectId);
          const qs = q.toString() ? `?${q}` : "";
          return apiClient.get(`/hrms/probation/policies/schema${qs}`);
        },
        getById: (id: string) => apiClient.get(`/hrms/probation/policies/${id}`),
        getDefault: () => apiClient.get("/hrms/probation/policies/default"),
        create: (data: ApiPayload) => apiClient.post("/hrms/probation/policies", data),
        update: (id: string, data: ApiPayload) => apiClient.put(`/hrms/probation/policies/${id}`, data),
        delete: (id: string) => apiClient.delete(`/hrms/probation/policies/${id}`),
        setDefault: (id: string) => apiClient.post(`/hrms/probation/policies/${id}/set-default`, {}),
      },
    },
  },
  screenings: {
    getSchedule: (params?: { status?: string; fromDate?: string; toDate?: string; search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set("status", params.status);
      if (params?.fromDate) q.set("fromDate", params.fromDate);
      if (params?.toDate) q.set("toDate", params.toDate);
      if (params?.search) q.set("search", params.search);
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      return apiClient.get(`/screenings/schedule?${q}`);
    },
    getResults: (params?: { result?: string; fromDate?: string; toDate?: string; search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.result) q.set("result", params.result);
      if (params?.fromDate) q.set("fromDate", params.fromDate);
      if (params?.toDate) q.set("toDate", params.toDate);
      if (params?.search) q.set("search", params.search);
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      return apiClient.get(`/screenings/results?${q}`);
    },
  },
  training: {
    getCourses: (skip = 0, take = 50) => apiClient.get(`/training/courses?skip=${skip}&take=${take}`),
    createCourse: (data: ApiPayload) => apiClient.post("/training/courses", data),
    getAssessments: (params?: { result?: string; assessmentType?: string; search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.result) q.set("result", params.result);
      if (params?.assessmentType) q.set("assessmentType", params.assessmentType);
      if (params?.search) q.set("search", params.search);
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      return apiClient.get(`/training/assessments?${q}`);
    },
    getCertificates: (params?: { expired?: boolean; search?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.expired !== undefined) q.set("expired", String(params.expired));
      if (params?.search) q.set("search", params.search);
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      return apiClient.get(`/training/certificates?${q}`);
    },
  },
  recruitment: {
    jobPostings: (page = 1, limit = 20) =>
      apiClient.get(`/recruitment/job-postings?page=${page}&limit=${limit}`),
    createJobPosting: (data: ApiPayload) => apiClient.post("/recruitment/job-postings", data),
  },
  appraisals: {
    cycles: {
      list: (page = 1, limit = 10) => apiClient.get(`/appraisals/cycles?page=${page}&limit=${limit}`),
      getById: (id: string) => apiClient.get(`/appraisals/cycles/${id}`),
      create: (data: ApiPayload) => apiClient.post("/appraisals/cycles", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/appraisals/cycles/${id}`, data),
      delete: (id: string) => apiClient.delete(`/appraisals/cycles/${id}`),
      activate: (id: string) => apiClient.post(`/appraisals/cycles/${id}/activate`, {}),
      appraisals: (cycleId: string) => apiClient.get(`/appraisals/cycles/${cycleId}/appraisals`),
    },
    list: (page = 1, limit = 10) => apiClient.get(`/appraisals?page=${page}&limit=${limit}`),
    listMine: (page = 1, limit = 10) => apiClient.get(`/appraisals?page=${page}&limit=${limit}`),
    getById: (id: string) => apiClient.get(`/appraisals/${id}`),
    create: (data: ApiPayload) => apiClient.post("/appraisals", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/appraisals/${id}`, data),
    selfAssess: (id: string, data: ApiPayload) => apiClient.post(`/appraisals/${id}/self-assess`, data),
    assess: (id: string, data: ApiPayload) => apiClient.post(`/appraisals/${id}/assess`, data),
    approve: (id: string, data?: ApiPayload) => apiClient.post(`/appraisals/${id}/approve`, data || {}),
    reject: (id: string, data?: ApiPayload) => apiClient.post(`/appraisals/${id}/reject`, data || {}),
  },
  lifecycle: {
    tasks: (kind = "Onboarding", employeeId?: string) => {
      const q = new URLSearchParams({ kind });
      if (employeeId) q.append("employeeId", employeeId);
      return apiClient.get(`/hrms/lifecycle/tasks?${q}`);
    },
    completeTask: (id: string) => apiClient.post(`/hrms/lifecycle/tasks/${id}/complete`, {}),
    createTask: (data: ApiPayload) => apiClient.post("/hrms/lifecycle/tasks", data),
  },
  organization: {
    getTree: (rootEmployeeId?: string, departmentId?: string) => {
      const q = new URLSearchParams();
      if (rootEmployeeId) q.set("rootEmployeeId", rootEmployeeId);
      if (departmentId) q.set("departmentId", departmentId);
      const qs = q.toString() ? `?${q}` : "";
      return apiClient.get(`/hrms/organization/tree${qs}`);
    },
    getMyTeam: (managerId?: string) => {
      const q = new URLSearchParams();
      if (managerId) q.set("managerId", managerId);
      const qs = q.toString() ? `?${q}` : "";
      return apiClient.get(`/hrms/organization/my-team${qs}`);
    },
    getTransfers: () => apiClient.get("/hrms/organization/transfers"),
    initiateTransfer: (data: ApiPayload) => apiClient.post("/hrms/organization/transfers", data),
    signOffTransfer: (id: string, stage: string, data: ApiPayload) => apiClient.post(`/hrms/organization/transfers/${id}/sign-off/${stage}`, data),
    getOrphanRisks: () => apiClient.get("/hrms/organization/orphan-risks"),
    reassignOrphans: (managerId: string, targetManagerId?: string) => {
      const q = targetManagerId ? `?targetManagerId=${targetManagerId}` : "";
      return apiClient.post(`/hrms/organization/orphan-risks/${managerId}/reassign-to-skip-level${q}`, {});
    },
    getDelegations: () => apiClient.get("/hrms/organization/delegations"),
    delegateAuthority: (data: ApiPayload) => apiClient.post("/hrms/organization/delegations", data),
    revokeDelegation: (employeeId: string) => apiClient.delete(`/hrms/organization/delegations/${employeeId}`),
  },
  me: () => apiClient.get("/employees/me"),
};
