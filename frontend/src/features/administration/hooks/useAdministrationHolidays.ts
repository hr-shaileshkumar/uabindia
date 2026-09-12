import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hrmsApi } from "@/services/modules/hrms";
import type { HolidayRecord } from "@/types";

export const platformHolidaysQueryKey = (year?: number) =>
  ["platform", "holidays", year ?? "all"] as const;

export const useAdministrationHolidays = (year?: number) =>
  useQuery({
    queryKey: platformHolidaysQueryKey(year),
    queryFn: async () => {
      const { data } = await hrmsApi.hrms.leave.holidays.list(year);
      return (Array.isArray(data) ? data : []) as HolidayRecord[];
    },
    staleTime: 60_000,
  });

export const useHolidayMutations = () => {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["platform", "holidays"] });
  };

  const createHoliday = useMutation({
    mutationFn: (payload: Parameters<typeof hrmsApi.hrms.leave.holidays.create>[0]) =>
      hrmsApi.hrms.leave.holidays.create(payload),
    onSuccess: invalidate,
  });

  return { createHoliday };
};

export const mapHolidayRecord = (holiday: HolidayRecord) => {
  const date = new Date(holiday.date);
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayOfWeek = Number.isNaN(date.getTime()) ? "—" : dayNames[date.getDay()];
  const dateLabel = Number.isNaN(date.getTime()) ? holiday.date : date.toISOString().slice(0, 10);

  return {
    id: holiday.id,
    name: holiday.name,
    date: dateLabel,
    dayOfWeek,
    type: normalizeHolidayType(holiday.type, holiday.isOptional),
    appliesTo: holiday.description ?? "All Branches & Locations",
  };
};

const normalizeHolidayType = (
  type?: string | null,
  isOptional?: boolean
): "National Public Holiday" | "State Holiday" | "Optional Holiday" => {
  if (isOptional) return "Optional Holiday";
  const value = (type ?? "").toLowerCase();
  if (value.includes("state")) return "State Holiday";
  if (value.includes("optional")) return "Optional Holiday";
  return "National Public Holiday";
};

export { useAdministrationHolidays as usePlatformHolidays };
