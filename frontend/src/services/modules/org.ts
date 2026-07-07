import apiClient from "@/services/apiClient";
import type { CompaniesResponse, ProjectsResponse } from "@/types";
import type { ApiPayload } from "./shared";

export const orgApi = {
  company: {
    getAll: (page = 1, limit = 10, includeDeleted?: boolean) =>
      apiClient.get<CompaniesResponse>(`/companies?page=${page}&limit=${limit}${includeDeleted ? "&includeDeleted=true" : ""}`),
    getAllForSuperAdmin: () => apiClient.get<{
      companies: Array<{
        id: string;
        name: string;
        tenantId: string;
        tenantName: string;
        financialYearStart?: string | null;
        financialYearEnd?: string | null;
      }>;
    }>("/companies/all"),
    getById: (id: string) => apiClient.get(`/companies/${id}`),
    create: (data: ApiPayload, options?: { tenant?: string }) =>
      apiClient.post("/companies", data, options?.tenant ? { headers: { "X-Tenant": options.tenant } } : undefined),
    update: (id: string, data: ApiPayload) => apiClient.put(`/companies/${id}`, data),
    delete: (id: string) => apiClient.delete(`/companies/${id}`),
  },
  project: {
    getAll: (companyId?: string, status?: string, includeDeleted?: boolean) => {
      const params = new URLSearchParams();
      if (companyId) params.append("companyId", companyId);
      if (status) params.append("status", status);
      if (includeDeleted) params.append("includeDeleted", "true");
      const qs = params.toString();
      return apiClient.get<ProjectsResponse>(`/projects${qs ? `?${qs}` : ""}`);
    },
    getById: (id: string) => apiClient.get(`/projects/${id}`),
    getByCompany: (companyId: string) => apiClient.get<ProjectsResponse>(`/projects?companyId=${companyId}`),
    restore: (id: string) => apiClient.post(`/projects/${id}/restore`, {}),
    create: (data: {
      name: string;
      companyId: string;
      tenantId?: string;
      projectCode?: string;
      description?: string;
      projectType?: string;
      priority?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      budget?: number;
      currencyCode?: string;
      clientName?: string;
      contractNumber?: string;
      billingType?: string;
      projectManagerId?: string;
      location?: string;
    }) => apiClient.post("/projects", data),
    update: (id: string, data: {
      name?: string;
      companyId?: string;
      projectCode?: string;
      description?: string;
      projectType?: string;
      priority?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      actualStartDate?: string;
      actualEndDate?: string;
      budget?: number;
      actualCost?: number;
      currencyCode?: string;
      clientName?: string;
      contractNumber?: string;
      billingType?: string;
      completionPercentage?: number;
      projectManagerId?: string;
      location?: string;
    }) => apiClient.put(`/projects/${id}`, data),
    delete: (id: string) => apiClient.delete(`/projects/${id}`),
  },
};
