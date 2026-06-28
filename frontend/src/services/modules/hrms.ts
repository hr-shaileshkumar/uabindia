import apiClient from "@/services/apiClient";

export const hrmsApi = {
  getHrDashboard: () => apiClient.get("/hr/dashboard"),
  getEmployees: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get("/employees", { params }),
  getEmployee: (id: string) => apiClient.get(`/employees/${id}`),
  createEmployee: (payload: Record<string, unknown>) => apiClient.post("/employees", payload),
  updateEmployee: (id: string, payload: Record<string, unknown>) => apiClient.put(`/employees/${id}`, payload),
  getAttendance: (params?: Record<string, string | number>) => apiClient.get("/attendance", { params }),
  getLeaveTypes: () => apiClient.get("/leave/types"),
  getLeaveRequests: (params?: Record<string, string | number>) => apiClient.get("/leave/requests", { params }),
  getShifts: () => apiClient.get("/shifts/shifts"),
  getRecruitmentPostings: (params?: { page?: number; limit?: number }) =>
    apiClient.get("/recruitment/job-postings", { params }),
};
