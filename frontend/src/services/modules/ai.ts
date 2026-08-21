import apiClient from "@/services/apiClient";
import type { ApiPayload } from "./shared";

export type AiChatContext = {
  message: string;
  agentKey?: string;
  recordType?: string;
  recordId?: string;
};

export const aiApi = {
  agents: {
    list: (page = 1, limit = 50, category?: string) => {
      const query = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (category) query.set("category", category);
      return apiClient.get(`/ai/agents?${query}`);
    },
    upsert: (data: ApiPayload) => apiClient.post("/ai/agents", data),
  },
  chat: (messageOrContext: string | AiChatContext, agentKey?: string) => {
    if (typeof messageOrContext === "string") {
      return apiClient.post("/ai/chat", { message: messageOrContext, agentKey });
    }
    return apiClient.post("/ai/chat", {
      message: messageOrContext.message,
      agentKey: messageOrContext.agentKey ?? agentKey,
      recordType: messageOrContext.recordType,
      recordId: messageOrContext.recordId,
    });
  },
};
