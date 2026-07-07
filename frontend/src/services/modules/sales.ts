import apiClient from "@/services/apiClient";
import type { ApiPayload } from "./shared";

export const salesApi = {
  customers: {
    getAll: (page = 1, limit = 10) => apiClient.get(`/customers?page=${page}&limit=${limit}`),
    getById: (id: string) => apiClient.get(`/customers/${id}`),
    create: (data: ApiPayload) => apiClient.post("/customers", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/customers/${id}`, data),
    delete: (id: string) => apiClient.delete(`/customers/${id}`),
  },
  salesOrders: {
    getAll: (page = 1, limit = 10) => apiClient.get(`/salesorders?page=${page}&limit=${limit}`),
    getById: (id: string) => apiClient.get(`/salesorders/${id}`),
    create: (data: ApiPayload) => apiClient.post("/salesorders", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/salesorders/${id}`, data),
    delete: (id: string) => apiClient.delete(`/salesorders/${id}`),
  },
};
