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
  grn: {
    getAll: (page = 1, limit = 50) => apiClient.get(`/grn?page=${page}&limit=${limit}`),
    create: (data: ApiPayload) => apiClient.post("/grn", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/grn/${id}`, data),
    delete: (id: string) => apiClient.delete(`/grn/${id}`),
    accept: (id: string, warehouseId?: string) =>
      apiClient.post(`/grn/${id}/accept`, warehouseId ? { warehouseId } : {}),
  },
  purchaseRequests: {
    getAll: (page = 1, limit = 50, status?: string) => {
      const q = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status) q.append("status", status);
      return apiClient.get(`/purchaserequests?${q}`);
    },
    create: (data: ApiPayload) => apiClient.post("/purchaserequests", data),
    approve: (id: string) => apiClient.post(`/purchaserequests/${id}/approve`, {}),
    reject: (id: string) => apiClient.post(`/purchaserequests/${id}/reject`, {}),
    convert: (id: string) => apiClient.post(`/purchaserequests/${id}/convert`, {}),
    match: (purchaseOrderId: string) => apiClient.get(`/purchaserequests/match/${purchaseOrderId}`),
  },
  bills: {
    getAll: (page = 1, limit = 20) => apiClient.get(`/purchaseinvoices?page=${page}&limit=${limit}`),
    create: (data: ApiPayload) => apiClient.post("/purchaseinvoices", data),
  },
};
