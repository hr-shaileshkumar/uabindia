import apiClient from "@/services/apiClient";
import type { ApiPayload } from "./shared";

export const procurementApi = {
  vendors: {
    getAll: (page = 1, limit = 10) => apiClient.get(`/vendors?page=${page}&limit=${limit}`),
    getById: (id: string) => apiClient.get(`/vendors/${id}`),
    create: (data: ApiPayload) => apiClient.post("/vendors", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/vendors/${id}`, data),
    delete: (id: string) => apiClient.delete(`/vendors/${id}`),
  },
  purchaseOrders: {
    getAll: (page = 1, limit = 10) => apiClient.get(`/purchaseorders?page=${page}&limit=${limit}`),
    getById: (id: string) => apiClient.get(`/purchaseorders/${id}`),
    create: (data: ApiPayload) => apiClient.post("/purchaseorders", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/purchaseorders/${id}`, data),
    delete: (id: string) => apiClient.delete(`/purchaseorders/${id}`),
  },
};
