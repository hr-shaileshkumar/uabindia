import { useQuery } from "@tanstack/react-query";
import { appApi } from "@/services/modules/app";

export type ApiKeySummary = {
  id?: string;
  name?: string;
  scope?: string;
  status?: string;
  createdAt?: string;
  lastUsedAt?: string;
};

type ApiKeysResponse = {
  apiKeys?: ApiKeySummary[];
};

export const apiKeysQueryKey = ["platform", "api-keys"] as const;

export const useApiKeys = () =>
  useQuery({
    queryKey: apiKeysQueryKey,
    queryFn: async () => {
      const { data } = await appApi.licensing.apiKeys();
      const payload = data as ApiKeysResponse;
      return payload.apiKeys ?? [];
    },
    staleTime: 30_000,
  });

export const mapApiKey = (item: ApiKeySummary, index: number) => ({
  id: item.id ?? `key-${index}`,
  name: item.name ?? "API Key",
  scope: item.scope ?? "read",
  status: item.status ?? "Active",
  createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN") : "-",
  lastUsed: item.lastUsedAt ? new Date(item.lastUsedAt).toLocaleDateString("en-IN") : "Never",
});
