import apiClient from "@/services/apiClient";
import type { ApiPayload } from "./shared";

export const travelApi = {
  requests: {
    list: (page = 1, limit = 20, status?: string) => {
      const query = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status) query.set("status", status);
      return apiClient.get(`/travel/requests?${query}`);
    },
    create: (data: ApiPayload) => apiClient.post("/travel/requests", data),
  },
  policies: {
    list: (companyId?: string, projectId?: string) => {
      const q = new URLSearchParams();
      if (companyId) q.set("companyId", companyId);
      if (projectId) q.set("projectId", projectId);
      const qs = q.toString() ? `?${q}` : "";
      return apiClient.get(`/travel/policies${qs}`);
    },
    getSchema: (companyId?: string, projectId?: string) => {
      const q = new URLSearchParams();
      if (companyId) q.set("companyId", companyId);
      if (projectId) q.set("projectId", projectId);
      const qs = q.toString() ? `?${q}` : "";
      return apiClient.get(`/travel/policies/schema${qs}`);
    },
    getById: (id: string) => apiClient.get(`/travel/policies/${id}`),
    getDefault: () => apiClient.get("/travel/policies/default"),
    create: (data: ApiPayload) => apiClient.post("/travel/policies", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/travel/policies/${id}`, data),
    delete: (id: string) => apiClient.delete(`/travel/policies/${id}`),
    setDefault: (id: string) => apiClient.post(`/travel/policies/${id}/set-default`, {}),
  },
};
