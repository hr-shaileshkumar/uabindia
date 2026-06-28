import apiClient from "@/services/apiClient";

export const erpApi = {
  getCustomers: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get("/customers", { params }),
  getCustomer: (id: string) => apiClient.get(`/customers/${id}`),
  createCustomer: (payload: Record<string, unknown>) => apiClient.post("/customers", payload),
  updateCustomer: (id: string, payload: Record<string, unknown>) => apiClient.put(`/customers/${id}`, payload),
  deleteCustomer: (id: string) => apiClient.delete(`/customers/${id}`),

  getVendors: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get("/vendors", { params }),
  getVendor: (id: string) => apiClient.get(`/vendors/${id}`),
  createVendor: (payload: Record<string, unknown>) => apiClient.post("/vendors", payload),
  updateVendor: (id: string, payload: Record<string, unknown>) => apiClient.put(`/vendors/${id}`, payload),
  deleteVendor: (id: string) => apiClient.delete(`/vendors/${id}`),

  getItems: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get("/items", { params }),
  getItem: (id: string) => apiClient.get(`/items/${id}`),
  createItem: (payload: Record<string, unknown>) => apiClient.post("/items", payload),
  updateItem: (id: string, payload: Record<string, unknown>) => apiClient.put(`/items/${id}`, payload),
  deleteItem: (id: string) => apiClient.delete(`/items/${id}`),

  getChartOfAccounts: () => apiClient.get("/chartofaccounts"),
  getJournalEntries: (params?: { page?: number; limit?: number }) =>
    apiClient.get("/journalentries", { params }),
  getPayments: (params?: { page?: number; limit?: number }) => apiClient.get("/payments", { params }),
  getSalesOrders: (params?: { page?: number; limit?: number }) => apiClient.get("/salesorders", { params }),
  getPurchaseOrders: (params?: { page?: number; limit?: number }) => apiClient.get("/purchaseorders", { params }),
  getWarehouses: () => apiClient.get("/warehouses"),
  getStockMovements: (params?: { page?: number; limit?: number }) =>
    apiClient.get("/stockmovements", { params }),
};
