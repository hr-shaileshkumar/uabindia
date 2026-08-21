import apiClient from "@/services/apiClient";
import type { ApiPayload } from "./shared";
import { crmApi } from "./crm";

export const salesApi = {
  /** Canonical customer master lives under CRM; legacy `/customers` routes remain on the API for compatibility. */
  customers: crmApi.customers,
  salesOrders: {
    getAll: (page = 1, limit = 10) => apiClient.get(`/salesorders?page=${page}&limit=${limit}`),
    getById: (id: string) => apiClient.get(`/salesorders/${id}`),
    create: (data: ApiPayload) => apiClient.post("/salesorders", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/salesorders/${id}`, data),
    delete: (id: string) => apiClient.delete(`/salesorders/${id}`),
    convertToInvoice: (id: string) => apiClient.post(`/salesorders/${id}/convert-to-invoice`, {}),
  },
  quotations: {
    getAll: (page = 1, limit = 10) => apiClient.get(`/salesquotations?page=${page}&limit=${limit}`),
    getById: (id: string) => apiClient.get(`/salesquotations/${id}`),
    create: (data: ApiPayload) => apiClient.post("/salesquotations", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/salesquotations/${id}`, data),
    delete: (id: string) => apiClient.delete(`/salesquotations/${id}`),
    convertToOrder: (id: string) => apiClient.post(`/salesquotations/${id}/convert-to-order`, {}),
  },
  discounts: {
    getAll: (page = 1, limit = 50) => apiClient.get(`/discountschemes?page=${page}&limit=${limit}`),
    getActive: () => apiClient.get("/discountschemes/active"),
    productMap: () => apiClient.get("/discountschemes/product-map"),
    getById: (id: string) => apiClient.get(`/discountschemes/${id}`),
    create: (data: ApiPayload) => apiClient.post("/discountschemes", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/discountschemes/${id}`, data),
    delete: (id: string) => apiClient.delete(`/discountschemes/${id}`),
  },
  invoices: {
    getAll: (page = 1, limit = 10) => apiClient.get(`/salesinvoices?page=${page}&limit=${limit}`),
    getById: (id: string) => apiClient.get(`/salesinvoices/${id}`),
    create: (data: ApiPayload) => apiClient.post("/salesinvoices", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/salesinvoices/${id}`, data),
    delete: (id: string) => apiClient.delete(`/salesinvoices/${id}`),
  },
  returns: {
    getAll: (page = 1, limit = 50) => apiClient.get(`/salesreturns?page=${page}&limit=${limit}`),
    create: (data: ApiPayload) => apiClient.post("/salesreturns", data),
    process: (id: string) => apiClient.post(`/salesreturns/${id}/process`, {}),
  },
};
