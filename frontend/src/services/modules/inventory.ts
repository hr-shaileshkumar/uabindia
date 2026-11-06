import apiClient from "@/services/apiClient";
import type { ApiPayload } from "./shared";

export const inventoryApi = {
  items: {
    getAll: (page = 1, limit = 10) => apiClient.get(`/items?page=${page}&limit=${limit}`),
    getById: (id: string) => apiClient.get(`/items/${id}`),
    create: (data: ApiPayload) => apiClient.post("/items", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/items/${id}`, data),
    delete: (id: string) => apiClient.delete(`/items/${id}`),
  },
  warehouses: {
    list: (page = 1, limit = 50) => apiClient.get(`/warehouses?page=${page}&limit=${limit}`),
    getById: (id: string) => apiClient.get(`/warehouses/${id}`),
    create: (data: ApiPayload) => apiClient.post("/warehouses", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/warehouses/${id}`, data),
    delete: (id: string) => apiClient.delete(`/warehouses/${id}`),
  },
  stockMovements: {
    list: (page = 1, limit = 20) => apiClient.get(`/stockmovements?page=${page}&limit=${limit}`),
    create: (data: ApiPayload) => apiClient.post("/stockmovements", data),
  },
};
