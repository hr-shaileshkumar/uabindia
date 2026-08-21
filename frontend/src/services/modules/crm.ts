import apiClient from "@/services/apiClient";
import type { ApiPayload } from "./shared";

export const crmApi = {
  customers: {
    getAll: (page = 1, limit = 10) => apiClient.get(`/crm/customers?page=${page}&limit=${limit}`),
    getById: (id: string) => apiClient.get(`/crm/customers/${id}`),
    create: (data: ApiPayload) => apiClient.post("/crm/customers", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/crm/customers/${id}`, data),
    delete: (id: string) => apiClient.delete(`/crm/customers/${id}`),
  },
  leads: {
    getAll: (page = 1, limit = 50) => apiClient.get(`/crm/leads?page=${page}&limit=${limit}`),
    getById: (id: string) => apiClient.get(`/crm/leads/${id}`),
    create: (data: ApiPayload) => apiClient.post("/crm/leads", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/crm/leads/${id}`, data),
    delete: (id: string) => apiClient.delete(`/crm/leads/${id}`),
    convertToQuotation: (id: string) => apiClient.post(`/crm/leads/${id}/convert-to-quotation`, {}),
  },
};
