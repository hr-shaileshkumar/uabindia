"use client";

import { useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";

type PasswordPolicy = {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
  maxAgeDays: number;
};

export default function PasswordPoliciesPage() {
  const [policy, setPolicy] = useState<PasswordPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await hrApi.security.passwordPolicy();
        setPolicy(res.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load password policy");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <StandardPageLayout
      title="Password & Access Policies"
      subtitle="Current password hardening and access-policy configuration."
      eyebrow="Security / Policies"
      icon="file"
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      {/* KPI summary cards */}
      <div className="erp-kpi-grid mb-4">
        <div className="erp-kpi-card"><p className="erp-kpi-label">Min Length</p><p className="erp-kpi-value">{policy?.minLength ?? '—'}</p><p className="erp-kpi-meta">Minimum password length</p></div>
        <div className="erp-kpi-card erp-kpi-card-info"><p className="erp-kpi-label">Max Age</p><p className="erp-kpi-value">{policy?.maxAgeDays ? `${policy.maxAgeDays}d` : '—'}</p><p className="erp-kpi-meta">Password expiry days</p></div>
        <div className="erp-kpi-card erp-kpi-card-success"><p className="erp-kpi-label">Complexity Rules</p><p className="erp-kpi-value erp-kpi-value-success">{policy ? [policy.requireUppercase, policy.requireLowercase, policy.requireNumber, policy.requireSpecial].filter(Boolean).length : 0}</p><p className="erp-kpi-meta">Active complexity rules</p></div>
        <div className="erp-kpi-card erp-kpi-card-warning"><p className="erp-kpi-label">Status</p><p className="erp-kpi-value text-sm">{loading ? 'Loading' : policy ? 'Configured' : 'Default'}</p><p className="erp-kpi-meta">Policy configuration state</p></div>
      </div>

      <div className="erp-panel">
        <div className="erp-table-toolbar">
          <div>
            <div className="erp-table-title">Password policy baseline</div>
            <div className="erp-table-subtitle">Review current credential hardening posture in a standardized policy card.</div>
          </div>
          <span className="erp-toolbar-badge">{loading ? "Loading..." : policy ? "Active" : "Unavailable"}</span>
        </div>
        <div className="rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(248,250,252,0.96))] p-4 text-sm text-slate-700">
          {policy ? (
            <ul className="space-y-2">
              <li>Minimum Length: {policy.minLength}</li>
              <li>Require Uppercase: {policy.requireUppercase ? "Yes" : "No"}</li>
              <li>Require Lowercase: {policy.requireLowercase ? "Yes" : "No"}</li>
              <li>Require Number: {policy.requireNumber ? "Yes" : "No"}</li>
              <li>Require Special: {policy.requireSpecial ? "Yes" : "No"}</li>
              <li>Max Age (days): {policy.maxAgeDays}</li>
            </ul>
          ) : !loading ? (
            <p>No password policy found.</p>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>
    </StandardPageLayout>
  );
}
