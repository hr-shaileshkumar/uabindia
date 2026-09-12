import { useQuery } from "@tanstack/react-query";
import { appApi } from "@/services/modules/app";
import type { DeviceSessionRecord, DeviceSessionsResponse } from "@/types";

export const deviceSessionsQueryKey = ["platform", "device-sessions"] as const;

export const useDeviceSessions = () =>
  useQuery({
    queryKey: deviceSessionsQueryKey,
    queryFn: async () => {
      const { data } = await appApi.security.deviceSessions();
      const payload = data as DeviceSessionsResponse;
      return payload.sessions ?? [];
    },
    staleTime: 15_000,
  });

export const mapDeviceSession = (session: DeviceSessionRecord, userEmail: string, index: number) => ({
  id: session.id,
  userEmail,
  device: session.deviceId || "Unknown device",
  ipAddress: "—",
  location: session.isRevoked ? "Revoked" : "Active",
  loginTime: formatSessionDate(session.expiresAt),
  isCurrent: index === 0 && !session.isRevoked,
  isRevoked: session.isRevoked,
});

const formatSessionDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
