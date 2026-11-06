"use client";

import React, { useState } from "react";
import {
  Shield,
  Key,
  Smartphone,
  Lock,
  Globe,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  UserCheck,
  ShieldAlert,
  Server,
  QrCode,
} from "lucide-react";
import { notifySuccess, notifyError } from "@/lib/notifications";

export interface UserSession {
  id: string;
  userName: string;
  device: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export const INITIAL_SESSIONS: UserSession[] = [
  {
    id: "sess-1",
    userName: "System Administrator (You)",
    device: "Windows 11 • Chrome 130",
    ipAddress: "103.21.244.18",
    location: "Mumbai, MH, India",
    lastActive: "Active Now",
    isCurrent: true,
  },
  {
    id: "sess-2",
    userName: "Vikram Seth (Finance Controller)",
    device: "macOS Sequoia • Safari 18",
    ipAddress: "14.143.12.84",
    location: "Bengaluru, KA, India",
    lastActive: "12 mins ago",
    isCurrent: false,
  },
  {
    id: "sess-3",
    userName: "Rohan Varma (Sales VP)",
    device: "iOS 18 • Safari Mobile",
    ipAddress: "49.36.120.44",
    location: "Pune, MH, India",
    lastActive: "45 mins ago",
    isCurrent: false,
  },
];

export function EnterpriseSecurityStudio() {
  const [sessions, setSessions] = useState<UserSession[]>(INITIAL_SESSIONS);
  const [mfaEnforced, setMfaEnforced] = useState(true);

  const handleRevokeSession = (id: string, name: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    notifySuccess(`Active session for ${name} has been revoked.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Enterprise Cybersecurity & Access Governance
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Zero Trust Architecture
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Two-Factor Authentication (TOTP), real-time session revocation, IP network whitelisting, and RBAC governance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => notifySuccess("Security audit check passed with zero vulnerabilities.")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Shield className="w-3.5 h-3.5" />
            Run Security Audit
          </button>
        </div>
      </div>

      {/* MFA & Governance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              MFA / 2FA Policy
            </span>
            <Smartphone className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-foreground">TOTP Authenticator Enforced</div>
          <p className="text-xs text-muted-foreground">
            Google Authenticator, Microsoft Authenticator or YubiKey required for all privileged accounts.
          </p>
          <div className="pt-2">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
              ✓ Active for 100% Admins
            </span>
          </div>
        </div>

        <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Password & Token Life
            </span>
            <Key className="w-4 h-4 text-primary" />
          </div>
          <div className="text-lg font-bold text-foreground">90-Day Rotation Cycle</div>
          <p className="text-xs text-muted-foreground">
            JWT token expiration: 15 minutes with rolling refresh token rotation and anti-tamper signature.
          </p>
          <div className="pt-2">
            <span className="text-xs font-semibold text-foreground bg-muted px-2.5 py-1 rounded-full">
              SHA-512 + BCrypt Salting
            </span>
          </div>
        </div>

        <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              IP Perimeter Lock
            </span>
            <Globe className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-lg font-bold text-foreground">Static Corporate CIDR</div>
          <p className="text-xs text-muted-foreground">
            Administrative endpoints locked to authorized BKC HQ and plant static leased lines.
          </p>
          <div className="pt-2">
            <span className="text-xs font-semibold text-purple-600 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/30">
              2 Allowed Subnets
            </span>
          </div>
        </div>
      </div>

      {/* Active User Sessions Table */}
      <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div>
            <h2 className="text-sm font-bold text-foreground">Active User Login Sessions</h2>
            <p className="text-xs text-muted-foreground">Live JWT token sessions across web browsers and mobile devices</p>
          </div>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-semibold">
            {sessions.length} Active
          </span>
        </div>

        <div className="overflow-x-auto border border-border/80 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="py-2.5 px-3">User & Identity</th>
                <th className="py-2.5 px-3">Device & Browser</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">Approximate Location</th>
                <th className="py-2.5 px-3">Last Activity</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sessions.map((sess) => (
                <tr key={sess.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      {sess.userName}
                      {sess.isCurrent && (
                        <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.2 rounded-sm font-bold">
                          THIS DEVICE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-foreground">{sess.device}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">{sess.ipAddress}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{sess.location}</td>
                  <td className="py-2.5 px-3 font-medium text-foreground">{sess.lastActive}</td>
                  <td className="py-2.5 px-3 text-center">
                    {!sess.isCurrent ? (
                      <button
                        onClick={() => handleRevokeSession(sess.id, sess.userName)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 transition-colors"
                      >
                        <LogOut className="w-3 h-3" />
                        Revoke
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-600 font-semibold">Active Session</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

