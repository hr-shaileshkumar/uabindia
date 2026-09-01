"use client";

import { useCallback, useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { ErpRefreshButton } from "@/components/workspace/page-kit";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpFormLabelClassName,
  erpPanelBodyClassName,
  erpPanelClassName,
  erpPanelHeaderClassName,
  erpPanelTitleClassName,
} from "@/components/workspace/styles";
import { Switch } from "@/components/ui/switch";
import { appApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import { notifyError, notifySuccess } from "@/lib/notifications";

type PasswordPolicy = {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
  maxAgeDays: number;
  maxFailedAttempts: number;
  lockoutMinutes: number;
};

const defaultPolicy: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false,
  maxAgeDays: 90,
  maxFailedAttempts: 5,
  lockoutMinutes: 15,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function PasswordPoliciesPage() {
  const [policy, setPolicy] = useState<PasswordPolicy>(defaultPolicy);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(JSON.stringify(defaultPolicy));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyPolicy = (data: Record<string, unknown>) => {
    const next: PasswordPolicy = {
      minLength: Number(data.minLength ?? defaultPolicy.minLength),
      requireUppercase: Boolean(data.requireUppercase ?? defaultPolicy.requireUppercase),
      requireLowercase: Boolean(data.requireLowercase ?? defaultPolicy.requireLowercase),
      requireNumber: Boolean(data.requireNumber ?? defaultPolicy.requireNumber),
      requireSpecial: Boolean(data.requireSpecial ?? defaultPolicy.requireSpecial),
      maxAgeDays: Number(data.maxAgeDays ?? defaultPolicy.maxAgeDays),
      maxFailedAttempts: Number(data.maxFailedAttempts ?? defaultPolicy.maxFailedAttempts),
      lockoutMinutes: Number(data.lockoutMinutes ?? defaultPolicy.lockoutMinutes),
    };
    setPolicy(next);
    setSavedSnapshot(JSON.stringify(next));
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await appApi.security.passwordPolicy();
      applyPolicy((res.data || {}) as Record<string, unknown>);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load password policy."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = JSON.stringify(policy) !== savedSnapshot;

  const handleSave = async () => {
    const payload: PasswordPolicy = {
      minLength: clamp(policy.minLength, 6, 128),
      requireUppercase: policy.requireUppercase,
      requireLowercase: policy.requireLowercase,
      requireNumber: policy.requireNumber,
      requireSpecial: policy.requireSpecial,
      maxAgeDays: clamp(policy.maxAgeDays, 0, 730),
      maxFailedAttempts: clamp(policy.maxFailedAttempts, 3, 20),
      lockoutMinutes: clamp(policy.lockoutMinutes, 1, 1440),
    };
    try {
      setSaving(true);
      setError(null);
      const res = await appApi.security.updatePasswordPolicy(payload);
      applyPolicy((res.data || payload) as Record<string, unknown>);
      notifySuccess("Password policy saved.");
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save password policy."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <StandardPageLayout
      title="Password Policy"
      subtitle="Configure complexity rules, expiration cycles, lockout thresholds, and history restrictions."
      eyebrow="Security / Governance"
      icon="shield"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Min length", value: policy.minLength, tone: "info" },
            { label: "Expiry", value: policy.maxAgeDays === 0 ? "Off" : `${policy.maxAgeDays}d`, tone: "neutral" },
            { label: "Lockout", value: `${policy.lockoutMinutes}m`, tone: "warning" },
            { label: "Status", value: dirty ? "Unsaved" : "Saved", tone: dirty ? "warning" : "positive" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          <button
            type="button"
            className={erpButtonClassName.primary}
            disabled={loading || saving || !dirty}
            onClick={() => void handleSave()}
          >
            {saving ? "Saving…" : "Save policy"}
          </button>
        </>
      }
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={erpPanelClassName}>
          <div className={erpPanelHeaderClassName}>
            <h2 className={erpPanelTitleClassName}>Complexity requirements</h2>
          </div>
          <div className={`${erpPanelBodyClassName} space-y-4`}>
            <div>
              <label className={erpFormLabelClassName} htmlFor="minLength">
                Minimum length
              </label>
              <input
                id="minLength"
                type="number"
                min={6}
                max={128}
                value={policy.minLength}
                disabled={loading || saving}
                className={`${erpFormInputClassName} mt-1.5`}
                onChange={(e) => setPolicy({ ...policy, minLength: Number(e.target.value) })}
              />
            </div>

            {(
              [
                { key: "requireUppercase" as const, label: "Require uppercase letters", detail: "At least one A–Z character" },
                { key: "requireLowercase" as const, label: "Require lowercase letters", detail: "At least one a–z character" },
                { key: "requireNumber" as const, label: "Require numbers", detail: "At least one digit" },
                { key: "requireSpecial" as const, label: "Require special characters", detail: "Symbols such as !@#$%^&*" },
              ] as const
            ).map((rule) => (
              <div key={rule.key} className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{rule.label}</p>
                  <p className="text-xs text-slate-500">{rule.detail}</p>
                </div>
                <Switch
                  checked={policy[rule.key]}
                  disabled={loading || saving}
                  onCheckedChange={(checked) => setPolicy({ ...policy, [rule.key]: checked })}
                  aria-label={rule.label}
                />
              </div>
            ))}
          </div>
        </section>

        <section className={erpPanelClassName}>
          <div className={erpPanelHeaderClassName}>
            <h2 className={erpPanelTitleClassName}>Rotation & lockout</h2>
          </div>
          <div className={`${erpPanelBodyClassName} space-y-4`}>
            <div>
              <label className={erpFormLabelClassName} htmlFor="maxAge">
                Password expiry (days)
              </label>
              <input
                id="maxAge"
                type="number"
                min={0}
                max={730}
                value={policy.maxAgeDays}
                disabled={loading || saving}
                className={`${erpFormInputClassName} mt-1.5`}
                onChange={(e) => setPolicy({ ...policy, maxAgeDays: Number(e.target.value) })}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Users must change passwords every {policy.maxAgeDays} days when enforced. Use 0 to disable expiry.
              </p>
            </div>
            <div>
              <label className={erpFormLabelClassName} htmlFor="maxFailed">
                Failed attempts before lockout
              </label>
              <input
                id="maxFailed"
                type="number"
                min={3}
                max={20}
                value={policy.maxFailedAttempts}
                disabled={loading || saving}
                className={`${erpFormInputClassName} mt-1.5`}
                onChange={(e) => setPolicy({ ...policy, maxFailedAttempts: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className={erpFormLabelClassName} htmlFor="lockoutMins">
                Lockout duration (minutes)
              </label>
              <input
                id="lockoutMins"
                type="number"
                min={1}
                max={1440}
                value={policy.lockoutMinutes}
                disabled={loading || saving}
                className={`${erpFormInputClassName} mt-1.5`}
                onChange={(e) => setPolicy({ ...policy, lockoutMinutes: Number(e.target.value) })}
              />
            </div>
          </div>
        </section>
      </div>
    </StandardPageLayout>
  );
}
