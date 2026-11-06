import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

const CONNECTION_CODES = new Set(["ERR_NETWORK", "ECONNREFUSED", "ECONNRESET", "ECONNABORTED", "ETIMEDOUT"]);

const shouldRetryRequest = (error: unknown) => {
  if (!(error instanceof AxiosError)) {
    return true;
  }

  const code = (error.code || "").toUpperCase();
  if (!error.response && CONNECTION_CODES.has(code)) {
    return false;
  }

  const status = error.response?.status ?? 0;
  return status === 408 || status === 429 || status >= 500;
};

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: (failureCount, error) => failureCount < 1 && shouldRetryRequest(error),
      },
      mutations: {
        retry: false,
      },
    },
  });
