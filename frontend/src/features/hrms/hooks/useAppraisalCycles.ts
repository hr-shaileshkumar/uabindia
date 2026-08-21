import { useQuery } from "@tanstack/react-query";
import { hrmsApi } from "@/services/modules/hrms";

export type AppraisalCycleSummary = {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: string;
  isActive: boolean;
  createdAt?: string;
};

type AppraisalCyclesResponse = {
  cycles?: AppraisalCycleSummary[];
  total?: number;
  page?: number;
  limit?: number;
};

export const appraisalCyclesQueryKey = (page: number, limit: number) =>
  ["hrms", "appraisal-cycles", page, limit] as const;

export const useAppraisalCycles = (page = 1, limit = 20) =>
  useQuery({
    queryKey: appraisalCyclesQueryKey(page, limit),
    queryFn: async () => {
      const { data } = await hrmsApi.appraisals.cycles.list(page, limit);
      return data as AppraisalCyclesResponse;
    },
    staleTime: 30_000,
  });

export const mapAppraisalCycle = (cycle: AppraisalCycleSummary) => ({
  id: cycle.id,
  name: cycle.name,
  period: `${new Date(cycle.startDate).toLocaleDateString("en-IN")} – ${new Date(cycle.endDate).toLocaleDateString("en-IN")}`,
  status: cycle.status,
  isActive: cycle.isActive,
});
