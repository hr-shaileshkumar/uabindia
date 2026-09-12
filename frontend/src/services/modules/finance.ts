import apiClient from "@/services/apiClient";
import type { ApiPayload } from "./shared";

export const financeApi = {
  chartOfAccounts: {
    getAll: (type?: string) => {
      const q = type && type !== "ALL" ? `?type=${encodeURIComponent(type)}` : "";
      return apiClient.get(`/chartOfAccounts${q}`);
    },
    getById: (id: string) => apiClient.get(`/chartOfAccounts/${id}`),
    create: (data: ApiPayload) => apiClient.post("/chartOfAccounts", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/chartOfAccounts/${id}`, data),
    delete: (id: string) => apiClient.delete(`/chartOfAccounts/${id}`),
    getBalances: () => apiClient.get("/chartOfAccounts/getBalances"),
    getTemplates: () => apiClient.get("/chartOfAccounts/templates"),
    seedStandard: (standardType = "IND_AS", currency?: string, companyId?: string) =>
      apiClient.post("/chartOfAccounts/seed-standard", {
        standardType,
        defaultCurrency: currency,
        companyId,
      }),
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
  expenses: {
    getAll: (page = 1, limit = 50, status?: string) => {
      const q = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status) q.append("status", status);
      return apiClient.get(`/expenses?${q}`);
    },
    create: (data: ApiPayload) => apiClient.post("/expenses", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/expenses/${id}`, data),
    delete: (id: string) => apiClient.delete(`/expenses/${id}`),
    approve: (id: string) => apiClient.post(`/expenses/${id}/approve`, {}),
    reject: (id: string, reason?: string) =>
      apiClient.post(`/expenses/${id}/reject`, reason ? { reason } : {}),
    markPaid: (id: string) => apiClient.post(`/expenses/${id}/mark-paid`, {}),
  },
  bankReconciliations: {
    getAll: (page = 1, limit = 50) => apiClient.get(`/bank-reconciliations?page=${page}&limit=${limit}`),
    getById: (id: string) => apiClient.get(`/bank-reconciliations/${id}`),
    create: (data: ApiPayload) => apiClient.post("/bank-reconciliations", data),
    update: (id: string, data: ApiPayload) => apiClient.put(`/bank-reconciliations/${id}`, data),
    delete: (id: string) => apiClient.delete(`/bank-reconciliations/${id}`),
  },
  bankFeeds: {
    parseOfx: (fileContent: string, currency = "INR") =>
      apiClient.post("/finance/bank-feed/parse-ofx", { fileContent, currency }),
    parseMt940: (fileContent: string, currency = "INR") =>
      apiClient.post("/finance/bank-feed/parse-mt940", { fileContent, currency }),
    parseCsv: (fileContent: string, currency = "INR") =>
      apiClient.post("/finance/bank-feed/parse-csv", { fileContent, currency }),
  },
  tax: {
    calculate: (data: ApiPayload) => apiClient.post("/tax/gst/calculate", data),
    gstr1: (year?: number, month?: number) => {
      const q = new URLSearchParams();
      if (year) q.append("year", String(year));
      if (month) q.append("month", String(month));
      const suffix = q.toString() ? `?${q}` : "";
      return apiClient.get(`/tax/gst/gstr1${suffix}`);
    },
    summary: () => apiClient.get("/tax/gst/summary"),
  },
  periods: {
    list: (year?: number) => apiClient.get(`/finance/periods${year ? `?year=${year}` : ""}`),
    close: (data: ApiPayload) => apiClient.post("/finance/periods/close", data),
    reopen: (data: ApiPayload) => apiClient.post("/finance/periods/reopen", data),
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
