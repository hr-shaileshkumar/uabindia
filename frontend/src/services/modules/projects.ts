import apiClient from "@/services/apiClient";
import type { ApiPayload } from "./shared";

export const projectsApi = {
  tasks: {
    getAll: (page = 1, limit = 50, projectId?: string, status?: string) => {
      const q = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (projectId) q.set("projectId", projectId);
      if (status) q.set("status", status);
      return apiClient.get(`/project-tasks?${q}`);
    },
    create: (data: ApiPayload) => apiClient.post("/project-tasks", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/project-tasks/${id}`, data),
    delete: (id: string) => apiClient.delete(`/project-tasks/${id}`),
  },
  timesheets: {
    getAll: (page = 1, limit = 50, filters?: { projectId?: string; employeeId?: string; status?: string }) => {
      const q = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filters?.projectId) q.set("projectId", filters.projectId);
      if (filters?.employeeId) q.set("employeeId", filters.employeeId);
      if (filters?.status) q.set("status", filters.status);
      return apiClient.get(`/timesheets?${q}`);
    },
    create: (data: ApiPayload) => apiClient.post("/timesheets", data),
    submit: (id: string) => apiClient.post(`/timesheets/${id}/submit`, {}),
    approve: (id: string) => apiClient.post(`/timesheets/${id}/approve`, {}),
    delete: (id: string) => apiClient.delete(`/timesheets/${id}`),
  },
};
