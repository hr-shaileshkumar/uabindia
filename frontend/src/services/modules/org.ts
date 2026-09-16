import apiClient from "@/services/apiClient";
import type { CompaniesResponse, ProjectsResponse } from "@/types";
import type { ApiPayload } from "./shared";

export const orgApi = {
  company: {
    getAll: (page = 1, limit = 10, includeDeleted?: boolean, options?: { headers?: Record<string, string> }) =>
      apiClient.get<CompaniesResponse>(`/companies?page=${page}&limit=${limit}${includeDeleted ? "&includeDeleted=true" : ""}`, options),
    getAllForSuperAdmin: (options?: { headers?: Record<string, string> }) => apiClient.get<{
      companies: Array<{
        id: string;
        name: string;
        tenantId: string;
        tenantName: string;
        financialYearStart?: string | null;
        financialYearEnd?: string | null;
      }>;
    }>("/companies/all", options),
    getById: (id: string) => apiClient.get(`/companies/${id}`),
    create: (data: ApiPayload, options?: { tenant?: string }) =>
      apiClient.post("/companies", data, options?.tenant ? { headers: { "X-Tenant": options.tenant } } : undefined),
    update: (id: string, data: ApiPayload) => apiClient.put(`/companies/${id}`, data),
    delete: (id: string) => apiClient.delete(`/companies/${id}`),
  },
  project: {
    getAll: (companyId?: string, status?: string, includeDeleted?: boolean, options?: { headers?: Record<string, string> }) => {
      const params = new URLSearchParams();
      if (companyId) params.append("companyId", companyId);
      if (status) params.append("status", status);
      if (includeDeleted) params.append("includeDeleted", "true");
      const qs = params.toString();
      return apiClient.get<ProjectsResponse>(`/projects${qs ? `?${qs}` : ""}`, options);
    },
    getById: (id: string) => apiClient.get(`/projects/${id}`),
    getByCompany: (companyId: string, options?: { headers?: Record<string, string> }) =>
      apiClient.get<ProjectsResponse>(`/projects?companyId=${companyId}`, options),
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
  contextEvents: {
    log: (data: {
      previousCompanyId?: string | null;
      previousProjectId?: string | null;
      companyId?: string | null;
      projectId?: string | null;
      companyName?: string | null;
      projectName?: string | null;
    }) => apiClient.post("/org-context/events", data),
  },
  orgStructure: {
    departments: {
      list: (companyId?: string) =>
        apiClient.get(`/org/departments${companyId ? `?companyId=${companyId}` : ""}`),
      create: (data: ApiPayload) => apiClient.post("/org/departments", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/org/departments/${id}`, data),
      delete: (id: string) => apiClient.delete(`/org/departments/${id}`),
    },
    designations: {
      list: (companyId?: string) =>
        apiClient.get(`/org/designations${companyId ? `?companyId=${companyId}` : ""}`),
      create: (data: ApiPayload) => apiClient.post("/org/designations", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/org/designations/${id}`, data),
      delete: (id: string) => apiClient.delete(`/org/designations/${id}`),
    },
    branches: {
      list: (companyId?: string) =>
        apiClient.get(`/org/branches${companyId ? `?companyId=${companyId}` : ""}`),
      create: (data: ApiPayload) => apiClient.post("/org/branches", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/org/branches/${id}`, data),
      delete: (id: string) => apiClient.delete(`/org/branches/${id}`),
    },
    costCenters: {
      list: (companyId?: string) =>
        apiClient.get(`/org/cost-centers${companyId ? `?companyId=${companyId}` : ""}`),
      create: (data: ApiPayload) => apiClient.post("/org/cost-centers", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/org/cost-centers/${id}`, data),
      delete: (id: string) => apiClient.delete(`/org/cost-centers/${id}`),
    },
    businessUnits: {
      list: (companyId?: string) =>
        apiClient.get(`/org/business-units${companyId ? `?companyId=${companyId}` : ""}`),
      create: (data: ApiPayload) => apiClient.post("/org/business-units", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/org/business-units/${id}`, data),
      delete: (id: string) => apiClient.delete(`/org/business-units/${id}`),
    },
    zones: {
      list: (companyId?: string) =>
        apiClient.get(`/org/zones${companyId ? `?companyId=${companyId}` : ""}`),
      create: (data: ApiPayload) => apiClient.post("/org/zones", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/org/zones/${id}`, data),
      delete: (id: string) => apiClient.delete(`/org/zones/${id}`),
    },
    regions: {
      list: (companyId?: string, zoneId?: string) => {
        const params = new URLSearchParams();
        if (companyId) params.append("companyId", companyId);
        if (zoneId) params.append("zoneId", zoneId);
        const qs = params.toString();
        return apiClient.get(`/org/regions${qs ? `?${qs}` : ""}`);
      },
      create: (data: ApiPayload) => apiClient.post("/org/regions", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/org/regions/${id}`, data),
      delete: (id: string) => apiClient.delete(`/org/regions/${id}`),
    },
    clusters: {
      list: (companyId?: string, regionId?: string) => {
        const params = new URLSearchParams();
        if (companyId) params.append("companyId", companyId);
        if (regionId) params.append("regionId", regionId);
        const qs = params.toString();
        return apiClient.get(`/org/clusters${qs ? `?${qs}` : ""}`);
      },
      create: (data: ApiPayload) => apiClient.post("/org/clusters", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/org/clusters/${id}`, data),
      delete: (id: string) => apiClient.delete(`/org/clusters/${id}`),
    },
    operationalLocations: {
      list: (companyId?: string, districtId?: string) => {
        const params = new URLSearchParams();
        if (companyId) params.append("companyId", companyId);
        if (districtId) params.append("districtId", districtId);
        const qs = params.toString();
        return apiClient.get(`/org/operational-locations${qs ? `?${qs}` : ""}`);
      },
      create: (data: ApiPayload) => apiClient.post("/org/operational-locations", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/org/operational-locations/${id}`, data),
      delete: (id: string) => apiClient.delete(`/org/operational-locations/${id}`),
    },
    postingUnits: {
      list: (companyId?: string, parentLocationId?: string) => {
        const params = new URLSearchParams();
        if (companyId) params.append("companyId", companyId);
        if (parentLocationId) params.append("parentLocationId", parentLocationId);
        const qs = params.toString();
        return apiClient.get(`/org/posting-units${qs ? `?${qs}` : ""}`);
      },
      create: (data: ApiPayload) => apiClient.post("/org/posting-units", data),
      update: (id: string, data: ApiPayload) => apiClient.put(`/org/posting-units/${id}`, data),
      delete: (id: string) => apiClient.delete(`/org/posting-units/${id}`),
    },
  },
  geography: {
    countries: () => apiClient.get("/geo/countries"),
    states: (countryId?: string) => apiClient.get(`/geo/states${countryId ? `?countryId=${countryId}` : ""}`),
    districts: (stateId?: string) => apiClient.get(`/geo/districts${stateId ? `?stateId=${stateId}` : ""}`),
    cities: (districtId?: string) => apiClient.get(`/geo/cities${districtId ? `?districtId=${districtId}` : ""}`),
    seedIndia: () => apiClient.post("/geo/seed-india", {}),
  },
};
