"use client";

import React, { useMemo } from "react";
import { ShieldCheck, Lock, Laptop, Globe } from "lucide-react";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/lib/api-errors";
import { mapDeviceSession, useDeviceSessions } from "@/features/platform/hooks/useDeviceSessions";

export default function SecuritySessionsPage() {
  const { user } = useAuth();
  const userEmail = user?.email ?? "Current user";
  const { data = [], isLoading, isError, error, refetch } = useDeviceSessions();

  const sessions = useMemo(
    () => data.map((session, index) => mapDeviceSession(session, userEmail, index)),
    [data, userEmail]
  );

  const activeSessions = sessions.filter((s) => !s.isRevoked);

  const kpis: KpiMetricItem[] = [
    { label: "Active Refresh Tokens", value: activeSessions.length, tone: "info", icon: <Laptop className="h-3.5 w-3.5" />, subtext: "Live API" },
    { label: "Revoked Tokens", value: sessions.filter((s) => s.isRevoked).length, tone: "warning", icon: <Lock className="h-3.5 w-3.5" />, subtext: "Revoked" },
    { label: "Scope", value: "Current User", tone: "info", icon: <Globe className="h-3.5 w-3.5" />, subtext: "Self-service" },
    { label: "Security Posture", value: activeSessions.length > 0 ? "Active" : "Idle", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Status" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Sessions"
      icon="shield"
      kpiMetrics={kpis}
      onRefresh={() => void refetch()}
      isLoading={isLoading}
      listKey="platform-sessions"
      listRows={sessions}
      listColumns={[
        { key: "userEmail", label: "User" },
        { key: "device", label: "Device ID" },
        { key: "loginTime", label: "Token expiry" },
        { key: "status", label: "Status" },
      ]}
      getRowId={(row) => row.id}
      emptyMessage="No active refresh-token sessions found."
      renderListRow={(s) => (
        <tr key={s.id} className="erp-tr">
          <td className="erp-td font-semibold">{s.userEmail}</td>
          <td className="erp-td font-mono text-xs">{s.device}</td>
          <td className="erp-td text-slate-600">{s.loginTime}</td>
          <td className="erp-td">
            <span className={s.isCurrent ? "erp-chip erp-chip-success" : s.isRevoked ? "erp-chip erp-chip-neutral" : "erp-chip erp-chip-info"}>
              {s.isCurrent ? "Current" : s.isRevoked ? "Revoked" : "Active"}
            </span>
          </td>
        </tr>
      )}
    >
      {isError ? <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load device sessions.")}</div> : null}
    </PlatformGlobalPageShell>
  );
}
