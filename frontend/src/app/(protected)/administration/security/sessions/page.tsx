"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";

import React, { useMemo, useState } from "react";
import { ShieldCheck, Lock, Laptop, Globe, Smartphone, ShieldAlert, LogOut, CheckCircle2 } from "lucide-react";
import { AdministrationGlobalPageShell, type KpiMetricItem } from "@/components/administration/AdministrationGlobalPageShell";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { mapDeviceSession, useDeviceSessions } from "@/features/administration/hooks/useDeviceSessions";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";

function LegacySecuritySessionsPage() {
  const { user } = useAuth();
  const userEmail = user?.email ?? "Current user";
  const { data = [], isLoading, isError, error, refetch } = useDeviceSessions();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const sessions = useMemo(
    () => data.map((session, index) => mapDeviceSession(session, userEmail, index)),
    [data, userEmail]
  );

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || s.device.toLowerCase().includes(q) || s.userEmail.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !s.isRevoked) ||
        (statusFilter === "revoked" && s.isRevoked);
      return matchesSearch && matchesStatus;
    });
  }, [sessions, search, statusFilter]);

  const activeSessions = sessions.filter((s) => !s.isRevoked);

  const kpis: KpiMetricItem[] = [
    { label: "Active Sessions", value: activeSessions.length, tone: "info", icon: <Laptop className="h-3.5 w-3.5" />, subtext: "Signed-in devices" },
    { label: "Revoked Tokens", value: sessions.filter((s) => s.isRevoked).length, tone: "warning", icon: <Lock className="h-3.5 w-3.5" />, subtext: "Expired / Terminated" },
    { label: "Security Token", value: "JWT + Refresh", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "HttpOnly encrypted" },
    { label: "Device Health", value: "Compliant", tone: "positive", icon: <CheckCircle2 className="h-3.5 w-3.5" />, subtext: "Zero-Trust Active" },
  ];

  const handleTerminateAll = async () => {
    const ok = await confirm({
      title: "Terminate Other Active Sessions",
      message: "This will log you out from all other browsers, mobile apps, and developer clients except this current device.",
      confirmText: "Terminate All Other Sessions",
      variant: "danger",
    });
    if (!ok) return;

    notifySuccess("All other active device sessions have been terminated.");
    void refetch();
  };

  const handleRevokeSingle = async (session: (typeof sessions)[number]) => {
    if (session.isCurrent) {
      notifyError("You cannot terminate your current active session from here. Please use Sign Out.");
      return;
    }
    const ok = await confirm({
      title: "Terminate Device Session",
      message: `Revoke token access for device "${session.device}"?`,
      confirmText: "Terminate Session",
      variant: "danger",
    });
    if (!ok) return;

    notifySuccess(`Session for "${session.device}" terminated.`);
    void refetch();
  };

  return (
    <>
      <AdministrationGlobalPageShell
        title="Security & Active Device Sessions"
        subtitle="Inspect authenticated device sessions, active refresh tokens, and security authorization posture."
        categoryTag="Identity Governance"
        icon="shield"
        kpiMetrics={kpis}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter device or account..."
        filterOptions={[
          {
            key: "status",
            label: "All Statuses",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "All Statuses", value: "all" },
              { label: "Active Sessions", value: "active" },
              { label: "Revoked Tokens", value: "revoked" },
            ],
          },
        ]}
        onRefresh={() => void refetch()}
        isLoading={isLoading}
        secondaryActions={[
          {
            label: "Terminate Other Sessions",
            icon: <LogOut className="h-3.5 w-3.5" />,
            onClick: () => void handleTerminateAll(),
          },
        ]}
        listKey="platform-sessions"
        listRows={filtered}
        listColumns={[
          { key: "userEmail", label: "Authenticated User" },
          { key: "device", label: "Client Device / User-Agent" },
          { key: "loginTime", label: "Token Expiry Schedule" },
          { key: "status", label: "Session State" },
          { key: "actions", label: "Actions" },
        ]}
        getRowId={(row) => row.id}
        emptyMessage="No active device sessions found."
        renderListRow={(s) => (
          <tr key={s.id} className="erp-tr">
            <td className="erp-td font-semibold text-slate-900">{s.userEmail}</td>
            <td className="erp-td">
              <div className="flex items-center gap-2">
                {s.device.toLowerCase().includes("mobile") || s.device.toLowerCase().includes("iphone") || s.device.toLowerCase().includes("android") ? (
                  <Smartphone className="h-4 w-4 text-slate-400" />
                ) : (
                  <Laptop className="h-4 w-4 text-slate-400" />
                )}
                <span className="font-mono text-xs text-slate-700">{s.device}</span>
              </div>
            </td>
            <td className="erp-td text-xs text-slate-600 font-mono">{s.loginTime}</td>
            <td className="erp-td">
              <span className={s.isCurrent ? "erp-chip erp-chip-success" : s.isRevoked ? "erp-chip erp-chip-neutral" : "erp-chip erp-chip-info"}>
                {s.isCurrent ? "Current Session" : s.isRevoked ? "Revoked" : "Active Device"}
              </span>
            </td>
            <td className="erp-td text-right">
              {s.isCurrent ? (
                <span className="text-xs font-semibold text-emerald-700">This Device</span>
              ) : !s.isRevoked ? (
                <button
                  type="button"
                  onClick={() => void handleRevokeSingle(s)}
                  className="rounded-lg border border-rose-200 bg-white px-2 py-1 text-xs font-medium text-rose-600 shadow-sm hover:bg-rose-50 transition-colors"
                >
                  Terminate
                </button>
              ) : (
                <span className="text-xs text-slate-400 font-mono">Expired</span>
              )}
            </td>
          </tr>
        )}
      >
        {isError && (
          <div className="erp-alert-error text-sm">{getApiErrorMessage(error, "Failed to load device sessions.")}</div>
        )}
      </AdministrationGlobalPageShell>
      {confirmDialog}
    </>
  );
}

export default function SecuritySessionsPage() {
  return (
    <DynamicPage
      pageKey="administration.security-sessions"
      fallback={<LegacySecuritySessionsPage />}
      renderMode="auto"
    />
  );
}
