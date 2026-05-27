import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

const shouldRetryRequest = (error: unknown) => {
  if (!(error instanceof AxiosError)) {
    return true;
  }

  const status = error.response?.status ?? 0;
  return status === 0 || status === 408 || status === 429 || status >= 500;
};

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => failureCount < 2 && shouldRetryRequest(error),
      },
      mutations: {
        retry: false,
      },
    },
  });
