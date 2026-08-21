import { useQuery } from "@tanstack/react-query";
import { travelApi } from "@/services/modules/travel";

export type TravelRequestSummary = {
  id: string;
  requestNumber: string;
  employeeName: string;
  destination: string;
  purpose: string;
  startDate: string;
  endDate: string;
  estimatedAmount: number;
  currencyCode: string;
  status: string;
};

type TravelRequestsResponse = {
  data?: TravelRequestSummary[];
  total?: number;
};

export const travelRequestsQueryKey = (page: number, limit: number) =>
  ["travel", "requests", page, limit] as const;

export const useTravelRequests = (page = 1, limit = 50) =>
  useQuery({
    queryKey: travelRequestsQueryKey(page, limit),
    queryFn: async () => {
      const { data } = await travelApi.requests.list(page, limit);
      return data as TravelRequestsResponse;
    },
    staleTime: 30_000,
  });

export const mapTravelRequest = (request: TravelRequestSummary) => ({
  id: request.id,
  number: request.requestNumber,
  employee: request.employeeName || "-",
  destination: request.destination,
  purpose: request.purpose,
  period: `${new Date(request.startDate).toLocaleDateString("en-IN")} – ${new Date(request.endDate).toLocaleDateString("en-IN")}`,
  amount: `${request.currencyCode ?? "INR"} ${Number(request.estimatedAmount ?? 0).toLocaleString("en-IN")}`,
  status: request.status,
});
