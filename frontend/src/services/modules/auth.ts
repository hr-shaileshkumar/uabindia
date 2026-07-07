import apiClient from "@/services/apiClient";

export const authApi = {
  csrfToken: () => apiClient.get("/auth/csrf-token"),
  login: (data: { email: string; password: string; deviceId: string }) =>
    apiClient.post("/auth/login", data),
  refresh: (data: { deviceId: string }) => apiClient.post("/auth/refresh", data),
  logout: () => apiClient.post("/auth/logout", {}),
  forgotPassword: (data: { email: string }) => apiClient.post("/auth/forgot-password", data),
  resetPassword: (data: { token: string; newPassword: string }) => apiClient.post("/auth/reset-password", data),
};
