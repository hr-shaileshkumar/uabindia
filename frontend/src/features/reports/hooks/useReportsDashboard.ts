"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/services/modules/reports";

export const reportsDashboardQueryKey = ["reports", "dashboard"] as const;

export const useReportsDashboard = () =>
  useQuery({
    queryKey: reportsDashboardQueryKey,
    queryFn: async () => {
      const { data } = await reportsApi.dashboard();
      return data;
    },
    staleTime: 60_000,
  });
