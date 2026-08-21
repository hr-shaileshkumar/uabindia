import { useQuery } from "@tanstack/react-query";
import { aiApi } from "@/services/modules/ai";

export type AiAgentSummary = {
  id: string;
  agentKey: string;
  name: string;
  description?: string;
  provider: string;
  modelName: string;
  category: string;
  isEnabled: boolean;
};

type AiAgentsResponse = {
  data?: AiAgentSummary[];
  total?: number;
};

export const aiAgentsQueryKey = (page: number, limit: number) =>
  ["platform", "ai-agents", page, limit] as const;

export const useAiAgents = (page = 1, limit = 50) =>
  useQuery({
    queryKey: aiAgentsQueryKey(page, limit),
    queryFn: async () => {
      const { data } = await aiApi.agents.list(page, limit);
      return data as AiAgentsResponse;
    },
    staleTime: 30_000,
  });

export const mapAiAgent = (agent: AiAgentSummary) => ({
  id: agent.id,
  key: agent.agentKey,
  name: agent.name,
  description: agent.description ?? "-",
  provider: agent.provider,
  model: agent.modelName || "-",
  category: agent.category,
  status: agent.isEnabled ? "Enabled" : "Disabled",
});
