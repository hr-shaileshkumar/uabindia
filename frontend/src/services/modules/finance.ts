import apiClient from "@/services/apiClient";
import type { ApiPayload } from "./shared";

export const financeApi = {
  chartOfAccounts: {
    getAll: () => apiClient.get("/chartOfAccounts"),
    getById: (id: string) => apiClient.get(`/chartOfAccounts/${id}`),
    create: (data: ApiPayload) => apiClient.post("/chartOfAccounts", data),
    getBalances: () => apiClient.get("/chartOfAccounts/getBalances"),
  },
  journalEntries: {
    list: (page = 1, limit = 20, status?: string) => {
      const q = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status) q.append("status", status);
      return apiClient.get(`/journalentries?${q}`);
    },
    getById: (id: string) => apiClient.get(`/journalentries/${id}`),
    create: (data: ApiPayload) => apiClient.post("/journalentries", data),
    post: (id: string) => apiClient.post(`/journalentries/${id}/post`, {}),
    deleteDraft: (id: string) => apiClient.delete(`/journalentries/${id}`),
  },
  payments: {
    list: (page = 1, limit = 20, paymentType?: string) => {
      const q = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (paymentType) q.append("paymentType", paymentType);
      return apiClient.get(`/payments?${q}`);
    },
    getById: (id: string) => apiClient.get(`/payments/${id}`),
    create: (data: ApiPayload) => apiClient.post("/payments", data),
    delete: (id: string) => apiClient.delete(`/payments/${id}`),
  },
};

export const complianceApi = {
  reports: {
    list: (pageNumber = 1, pageSize = 10) => apiClient.get(`/compliance/reports?pageNumber=${pageNumber}&pageSize=${pageSize}`),
    listByType: (reportType: string, pageNumber = 1, pageSize = 10) => apiClient.get(`/compliance/reports/${encodeURIComponent(reportType)}?pageNumber=${pageNumber}&pageSize=${pageSize}`),
    create: (data: ApiPayload) => apiClient.post("/compliance/reports", data),
  },
  audits: {
    list: (pageNumber = 1, pageSize = 10) => apiClient.get(`/compliance/audits?pageNumber=${pageNumber}&pageSize=${pageSize}`),
    create: (data: ApiPayload) => apiClient.post("/compliance/audits", data),
  },
};
