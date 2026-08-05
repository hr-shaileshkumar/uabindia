"use client";

import React, { useState } from "react";
import { ShieldCheck, Lock, LogOut, Laptop, Globe, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface SessionRow {
  id: string;
  userEmail: string;
  device: string;
  ipAddress: string;
  location: string;
  loginTime: string;
  isCurrent: boolean;
}

const SEED_SESSIONS: SessionRow[] = [
  { id: "sess_1", userEmail: "admin@uabindia.in", device: "Chrome 126 on Windows 11", ipAddress: "103.21.124.8", location: "Mumbai, India", loginTime: "2026-07-29 09:15", isCurrent: true },
  { id: "sess_2", userEmail: "superadmin@uabindia.com", device: "Safari 17 on macOS", ipAddress: "103.21.124.8", location: "Mumbai, India", loginTime: "2026-07-29 08:30", isCurrent: false },
  { id: "sess_3", userEmail: "sales.lead@acme.com", device: "Chrome 126 on Android", ipAddress: "49.36.18.91", location: "Bengaluru, India", loginTime: "2026-07-28 14:00", isCurrent: false },
];

export default function SecuritySessionsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>(SEED_SESSIONS);

  const handleForceLogout = (id: string, email: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    notifySuccess(`Session for "${email}" terminated.`);
  };

  const kpis: KpiMetricItem[] = [
    { label: "Active User Sessions", value: sessions.length, tone: "info", icon: <Laptop className="h-3.5 w-3.5" />, subtext: "Live Devices" },
    { label: "MFA Enforcement", value: "Strict TOTP", tone: "positive", icon: <Lock className="h-3.5 w-3.5" />, subtext: "Enforced" },
    { label: "SSO Providers", value: "Google & Azure AD", tone: "info", icon: <Globe className="h-3.5 w-3.5" />, subtext: "OAuth2" },
    { label: "Security Risk Score", value: "0 / 100", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Low Risk" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Active User Sessions & Security Policies"
      subtitle="Monitor live active user sessions, force terminate suspicious tokens, and enforce MFA / SSO policies."
      categoryTag="Security Governance"
      kpiMetrics={kpis}
    >
      <div className="erp-table-wrap rounded-none border-0 shadow-none">
        <table className="erp-table">
          <thead className="erp-thead">
            <tr>
              <th className="erp-th">Authenticated User Email</th>
              <th className="erp-th">Browser & Device OS</th>
              <th className="erp-th">IP Address</th>
              <th className="erp-th">Geographic Location</th>
              <th className="erp-th">Login Timestamp</th>
              <th className="erp-th text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="erp-tr hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors">
                <td className="erp-td font-semibold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Laptop className="h-4 w-4 text-indigo-500" />
                  {s.userEmail}
                </td>
                <td className="erp-td font-mono text-xs text-slate-700 dark:text-slate-300">{s.device}</td>
                <td className="erp-td font-mono text-xs text-indigo-600 dark:text-indigo-400">{s.ipAddress}</td>
                <td className="erp-td text-xs text-slate-600 dark:text-slate-400">{s.location}</td>
                <td className="erp-td text-xs text-slate-500">{s.loginTime}</td>
                <td className="erp-td text-right">
                  {s.isCurrent ? (
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                      Your Current Session
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm" className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleForceLogout(s.id, s.userEmail)}>
                      <LogOut className="h-3.5 w-3.5 mr-1" />
                      Force Revoke
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlatformGlobalPageShell>
  );
}
