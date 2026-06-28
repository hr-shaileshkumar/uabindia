import apiClient from "@/services/apiClient";

export type LoginPayload = {
  email: string;
  password: string;
  deviceId?: string;
};

export type AuthUserResponse = {
  userId?: string;
  id?: string;
  email: string;
  fullName?: string;
  role?: string;
  roles?: string[];
  companyId?: string;
  tenantId?: string;
};

export const iamApi = {
  login: (payload: LoginPayload) => apiClient.post("/auth/login", payload),
  logout: () => apiClient.post("/auth/logout"),
  refresh: () => apiClient.post("/auth/refresh"),
  me: () => apiClient.get<AuthUserResponse>("/auth/me"),
  forgotPassword: (email: string) => apiClient.post("/auth/forgot-password", { email }),
  resetPassword: (payload: { token: string; newPassword: string }) => apiClient.post("/auth/reset-password", payload),
  requestAccess: (payload: Record<string, string>) => apiClient.post("/auth/request-access", payload),
};
