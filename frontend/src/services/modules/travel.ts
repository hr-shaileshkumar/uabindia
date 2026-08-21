import apiClient from "@/services/apiClient";
import type { ApiPayload } from "./shared";

export const travelApi = {
  requests: {
    list: (page = 1, limit = 20, status?: string) => {
      const query = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status) query.set("status", status);
      return apiClient.get(`/travel/requests?${query}`);
    },
    create: (data: ApiPayload) => apiClient.post("/travel/requests", data),
  },
};
