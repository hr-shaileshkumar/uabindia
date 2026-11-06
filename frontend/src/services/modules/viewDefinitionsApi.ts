import apiClient from "../apiClient";

export interface ColumnSetting {
  key: string;
  visible: boolean;
  order: number;
  width?: number;
  pinned?: "left" | "right" | false;
}

export type RowDensity = "compact" | "normal" | "comfortable";

export interface ApiViewDefinition {
  id: string;
  pageKey: string;
  name: string;
  scope: "Personal" | "Role" | "Tenant";
  targetRole?: string | null;
  userId?: string | null;
  filters: Record<string, any>;
  columns: ColumnSetting[];
  sortKey?: string | null;
  sortDir: "asc" | "desc";
  groupBy?: string | null;
  density: RowDensity;
  isDefault: boolean;
  createdAt: string;
  createdBy?: string | null;
}

export interface CreateViewPayload {
  pageKey: string;
  name: string;
  scope?: "Personal" | "Role" | "Tenant";
  targetRole?: string | null;
  filters: Record<string, any>;
  columns: ColumnSetting[];
  sortKey?: string | null;
  sortDir?: "asc" | "desc";
  groupBy?: string | null;
  density?: RowDensity;
  isDefault?: boolean;
}

export const viewDefinitionsApi = {
  async getViews(pageKey: string): Promise<ApiViewDefinition[]> {
    try {
      const response = await apiClient.get<{ data: ApiViewDefinition[]; count: number }>(
        `/views/${encodeURIComponent(pageKey)}`,
        { headers: { "X-Silent-Error": "1" } }
      );
      return response.data?.data || [];
    } catch (err) {
      console.warn(`[viewDefinitionsApi] Failed to fetch views for ${pageKey}:`, err);
      return [];
    }
  },

  async createView(payload: CreateViewPayload): Promise<ApiViewDefinition> {
    const response = await apiClient.post<ApiViewDefinition>("/views", payload, {
      headers: { "X-Silent-Error": "1" },
    });
    return response.data;
  },

  async updateView(id: string, payload: Partial<CreateViewPayload>): Promise<ApiViewDefinition> {
    const response = await apiClient.put<ApiViewDefinition>(`/views/${id}`, payload, {
      headers: { "X-Silent-Error": "1" },
    });
    return response.data;
  },

  async setDefaultView(id: string): Promise<void> {
    await apiClient.post(`/views/${id}/default`, null, {
      headers: { "X-Silent-Error": "1" },
    });
  },

  async deleteView(id: string): Promise<void> {
    await apiClient.delete(`/views/${id}`, {
      headers: { "X-Silent-Error": "1" },
    });
  },
};
