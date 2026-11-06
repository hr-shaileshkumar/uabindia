import apiClient from "@/services/apiClient";
import type { ApiPayload } from "./shared";

export const policyApi = {
  list: (params?: { category?: string; status?: string; search?: string; companyId?: string; projectId?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append("category", params.category);
    if (params?.status) query.append("status", params.status);
    if (params?.search) query.append("search", params.search);
    if (params?.companyId) query.append("companyId", params.companyId);
    if (params?.projectId) query.append("projectId", params.projectId);
    const suffix = query.toString() ? `?${query}` : "";
    return apiClient.get(`/policies${suffix}`);
  },
  getUiSchema: (params?: { companyId?: string; projectId?: string }) => {
    const query = new URLSearchParams();
    if (params?.companyId) query.append("companyId", params.companyId);
    if (params?.projectId) query.append("projectId", params.projectId);
    const suffix = query.toString() ? `?${query}` : "";
    return apiClient.get(`/policies/ui-schema${suffix}`);
  },
  getCategorySchema: (category: string, params?: { companyId?: string; projectId?: string }) => {
    const query = new URLSearchParams();
    if (params?.companyId) query.append("companyId", params.companyId);
    if (params?.projectId) query.append("projectId", params.projectId);
    const suffix = query.toString() ? `?${query}` : "";
    return apiClient.get(`/policies/schema/${category}${suffix}`);
  },
  getById: (id: string) => apiClient.get(`/policies/${id}`),
  create: (data: ApiPayload) => apiClient.post("/policies", data),
  update: (id: string, data: ApiPayload) => apiClient.put(`/policies/${id}`, data),
  delete: (id: string) => apiClient.delete(`/policies/${id}`),
  versions: {
    list: (policyId: string) => apiClient.get(`/policies/${policyId}/versions`),
    create: (policyId: string, data: ApiPayload) => apiClient.post(`/policies/${policyId}/versions`, data),
    activate: (policyId: string, versionId: string) =>
      apiClient.post(`/policies/${policyId}/versions/${versionId}/activate`, {}),
  },
  evaluate: (data: ApiPayload) => apiClient.post("/policies/evaluate", data),
  simulate: (data: ApiPayload) => apiClient.post("/policies/simulate", data),
  definitions: {
    list: (params?: { category?: string; companyId?: string; projectId?: string }) => {
      const query = new URLSearchParams();
      if (params?.category) query.append("category", params.category);
      if (params?.companyId) query.append("companyId", params.companyId);
      if (params?.projectId) query.append("projectId", params.projectId);
      const suffix = query.toString() ? `?${query}` : "";
      return apiClient.get(`/policies/definitions${suffix}`);
    },
    create: (data: ApiPayload) => apiClient.post("/policies/definitions", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/policies/definitions/${id}`, data),
    delete: (id: string) => apiClient.delete(`/policies/definitions/${id}`),
    bulk: (data: ApiPayload[]) => apiClient.post("/policies/definitions/bulk", data),
  },
  acknowledgments: {
    list: (policyId: string) => apiClient.get(`/policies/${policyId}/acknowledgments`),
    sign: (policyId: string, data?: ApiPayload) => apiClient.post(`/policies/${policyId}/acknowledge`, data ?? {}),
  },
};
