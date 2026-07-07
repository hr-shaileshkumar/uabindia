"use client";

import { ShieldCheck, Smartphone, Key, CheckCircle, AlertCircle, Info } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { ROUTES } from "@/constants/routes";
import Link from "next/link";

const MFA_METHODS = [
  {
    icon: <Smartphone className="h-6 w-6" />,
    title: "Authenticator App",
    description: "TOTP-based MFA via Google Authenticator, Microsoft Authenticator, or Authy.",
    status: "Planned",
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    icon: <Key className="h-6 w-6" />,
    title: "Hardware Security Key",
    description: "FIDO2/WebAuthn support for hardware keys like YubiKey or platform authenticators.",
    status: "Planned",
    bg: "bg-indigo-50",
    iconColor: "text-indigo-600",
  },
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: "SMS / Email OTP",
    description: "One-time password delivery via SMS or email for step-up verification.",
    status: "Planned",
    bg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
];

const ROADMAP_ITEMS = [
  "Enforce MFA enrollment by role, module, or risk level",
  "Organization-wide or department-scoped MFA policy",
  "Review enrolled authenticators and recovery codes",
  "MFA bypass allowlist for trusted devices / IP ranges",
  "Audit log of all MFA challenges and failures",
  "Staged rollout before organization-wide enforcement",
  "Self-service MFA enrollment portal for employees",
];

export default function MfaPage() {
  return (
    <StandardPageLayout
      title="Multi-Factor Authentication"
      subtitle="Strengthen authentication with additional verification layers for all ERP users and administrator accounts."
      eyebrow="Security / Verification"
      icon="shield"
      actions={
        <Link href={ROUTES.SECURITY_HOME} className="erp-action-btn erp-action-btn-secondary">
          Back to Security
        </Link>
      }
    >
      {/* KPI summary */}
      <div className="erp-kpi-grid">
        <div className="erp-kpi-card">
          <p className="erp-kpi-label">MFA Coverage</p>
          <p className="erp-kpi-value">0%</p>
          <p className="erp-kpi-meta">Users with MFA enabled</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-warning">
          <p className="erp-kpi-label">Enrolled Users</p>
          <p className="erp-kpi-value">0</p>
          <p className="erp-kpi-meta">Active MFA enrollments</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-info">
          <p className="erp-kpi-label">Methods Available</p>
          <p className="erp-kpi-value">{MFA_METHODS.length}</p>
          <p className="erp-kpi-meta">Supported authentication factors</p>
        </div>
        <div className="erp-kpi-card erp-kpi-card-neutral">
          <p className="erp-kpi-label">Status</p>
          <p className="erp-kpi-value text-sm font-semibold text-amber-600">Roadmap</p>
          <p className="erp-kpi-meta">Feature in development</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200/85 bg-[linear-gradient(135deg,rgba(239,246,255,0.9),rgba(224,242,254,0.85),rgba(238,242,255,0.75))] px-5 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
        <Info className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-900">MFA is on the product roadmap</p>
          <p className="mt-1 text-sm text-blue-800">
            Multi-factor authentication APIs and enrollment workflows are not yet live. This page shows planned capabilities and will become functional once the feature is deployed.
            Active sessions can be managed from the <Link href={ROUTES.SECURITY_SESSIONS} className="font-semibold underline">Sessions</Link> page.
          </p>
        </div>
      </div>

      {/* MFA Methods */}
      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">Supported Authentication Methods</h2>
            <p className="mt-1 text-sm text-slate-500">These factors will be available for enrollment when MFA is activated.</p>
          </div>
          <span className="erp-chip erp-chip-warning">Coming Soon</span>
        </div>
        <div className="erp-panel-body">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MFA_METHODS.map((method) => (
              <div key={method.title} className={`rounded-2xl border border-slate-200/70 ${method.bg} p-5 shadow-[0_10px_22px_rgba(15,23,42,0.06)]`}>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 shadow-sm ${method.iconColor}`}>
                  {method.icon}
                </div>
                <h3 className="mt-4 font-bold text-slate-900">{method.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{method.description}</p>
                <div className="mt-4 flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-700">{method.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="erp-panel">
        <div className="erp-panel-header">
          <div>
            <h2 className="erp-panel-title">MFA Feature Roadmap</h2>
            <p className="mt-1 text-sm text-slate-500">Planned capabilities included in the upcoming MFA release.</p>
          </div>
        </div>
        <div className="erp-panel-body">
          <div className="grid gap-2 sm:grid-cols-2">
            {ROADMAP_ITEMS.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(255,255,255,0.96))] px-4 py-3">
                <CheckCircle className="h-4 w-4 flex-shrink-0 text-slate-400 mt-0.5" />
                <span className="text-sm text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StandardPageLayout>
  );
}
