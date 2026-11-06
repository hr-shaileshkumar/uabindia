import apiClient from "@/services/apiClient";

export interface PermissionActionItem {
  key: string;
  label: string;
  description?: string;
}

export interface PageCatalogItem {
  key: string;
  title: string;
  route: string;
  subGroup?: string;
  actions: PermissionActionItem[];
}

export interface ModuleCatalogItem {
  key: string;
  title: string;
  icon?: string;
  description?: string;
  pages: PageCatalogItem[];
}

export interface UserPermissionGrantItem {
  module: string;
  pageKey: string;
  action: string;
}

export interface UserPermissionRecord {
  module: string;
  pageKey: string;
  action: string;
  isGranted: boolean;
}

export interface UserPermissionsResponse {
  userId: string;
  fullName?: string;
  email?: string;
  role?: string;
  permissions: UserPermissionRecord[];
}

export const permissionsApi = {
  getCatalog: () =>
    apiClient.get<{ catalog: ModuleCatalogItem[]; totalModules: number }>("/permissions/catalog"),

  getUserPermissions: (userId: string) =>
    apiClient.get<UserPermissionsResponse>(`/permissions/users/${userId}`),

  saveUserPermissions: (userId: string, permissions: UserPermissionGrantItem[]) =>
    apiClient.post<{ success: boolean; count: number; message: string }>(
      `/permissions/users/${userId}/batch`,
      { userId, permissions }
    ),

  getUsers: () =>
    apiClient.get<{ users: Array<{ id: string; firstName: string; lastName: string; email: string; role: string; isActive: boolean }> }>("/users"),
};
