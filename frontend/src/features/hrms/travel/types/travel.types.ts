import { mapTravelRequest } from "@/features/hrms/hooks/useTravelRequests";

export type TravelRow = ReturnType<typeof mapTravelRequest>;

export type TravelFormState = {
  employeeId: string;
  employeeName: string;
  destination: string;
  purpose: string;
  startDate: string;
  endDate: string;
  estimatedAmount: string;
};
