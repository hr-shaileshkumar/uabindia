"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";

import { useCallback, useEffect, useMemo, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ListCreateButton } from "@/components/workspace/list-toolbar";
import { ErpRefreshButton } from "@/components/workspace/page-kit";
import { useErpListView } from "@/components/workspace/list-view";
import { Switch } from "@/components/ui/switch";
import {
  erpButtonClassName,
  erpFormInputClassName,
  erpFormLabelClassName,
  erpPanelBodyClassName,
  erpPanelClassName,
  erpPanelHeaderClassName,
  erpPanelTitleClassName,
} from "@/components/workspace/styles";
import { appApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";

type MfaPolicy = {
  requireMfaPlatformAdmins: boolean;
  requireMfaTenantAdmins: boolean;
  allowTotp: boolean;
  allowSmsOtp: boolean;
};

type Enrollment = {
  id: string;
  userName?: string;
  userEmail?: string;
  method?: string;
  status?: string;
  enrolledAt?: string;
};

type DirectoryUser = { id: string; email?: string; fullName?: string };

const defaultPolicy: MfaPolicy = {
  requireMfaPlatformAdmins: false,
  requireMfaTenantAdmins: false,
  allowTotp: true,
  allowSmsOtp: false,
};

const asList = <T,>(raw: unknown): T[] => {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as T[];
  }
  return [];
};

const chip = (status?: string) => {
  const s = (status || "").toLowerCase();
  if (s === "enrolled") return "erp-chip erp-chip-success";
  if (s === "disabled") return "erp-chip erp-chip-neutral";
  return "erp-chip erp-chip-warning";
};

function LegacyMultiFactorAuthenticationPage() {
  const [policy, setPolicy] = useState<MfaPolicy>(defaultPolicy);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [method, setMethod] = useState("TOTP");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [policyRes, enrollRes, userRes] = await Promise.all([
        appApi.security.mfaPolicy(),
        appApi.security.mfaEnrollments(),
        appApi.security.directoryUsers(),
      ]);
      const data = (policyRes.data || {}) as Record<string, unknown>;
      setPolicy({
        requireMfaPlatformAdmins: Boolean(data.requireMfaPlatformAdmins),
        requireMfaTenantAdmins: Boolean(data.requireMfaTenantAdmins),
        allowTotp: data.allowTotp !== false,
        allowSmsOtp: Boolean(data.allowSmsOtp),
      });
      setEnrollments(asList<Enrollment>(enrollRes.data));
      setUsers(asList<DirectoryUser>(userRes.data));
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load MFA settings."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const enrolledCount = useMemo(() => enrollments.filter((e) => e.status === "Enrolled").length, [enrollments]);

  const savePolicy = async (next: MfaPolicy) => {
    setPolicy(next);
    try {
      setSaving(true);
      await appApi.security.updateMfaPolicy(next);
      notifySuccess("MFA policy saved.");
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save MFA policy."));
      void load();
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!userId) {
      notifyError("Select a user.");
      return;
    }
    try {
      setCreating(true);
      await appApi.security.createMfaEnrollment({ userId, method });
      notifySuccess("Enrollment created.");
      setDrawerOpen(false);
      setUserId("");
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to create enrollment."));
    } finally {
      setCreating(false);
    }
  };

  const runAction = async (id: string, action: "enroll" | "disable") => {
    try {
      if (action === "enroll") await appApi.security.enrollMfa(id);
      else await appApi.security.disableMfa(id);
      notifySuccess(action === "enroll" ? "Marked enrolled." : "Enrollment disabled.");
      void load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Action failed."));
    }
  };

  const list = useErpListView({
    listKey: "security-mfa-enrollments",
    rows: enrollments,
    columns: [
      { key: "userName", label: "User" },
      { key: "method", label: "Method" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Actions", className: "text-right", locked: true },
    ],
    getRowId: (row) => row.id,
    loading,
    emptyMessage: "No enrolled users yet. Add an enrollment to start tracking MFA for this tenant.",
    onCreate: () => setDrawerOpen(true),
    createLabel: "Add enrollment",
    onRefresh: () => void load(),
    renderRow: (row) => (
      <tr key={row.id} className="erp-tr">
        <td className="erp-td">
          <p className="font-semibold text-slate-900">{row.userName || "—"}</p>
          <p className="text-xs text-slate-500">{row.userEmail}</p>
        </td>
        <td className="erp-td">
          <span className="erp-chip erp-chip-neutral">{row.method}</span>
        </td>
        <td className="erp-td">
          <span className={chip(row.status)}>{row.status}</span>
        </td>
        <td className="erp-td text-right">
          {row.status === "Pending" ? (
            <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2`} onClick={() => void runAction(row.id, "enroll")}>
              Mark enrolled
            </button>
          ) : null}
          {row.status !== "Disabled" ? (
            <button type="button" className={`${erpButtonClassName.ghost} h-8 px-2 text-rose-600`} onClick={() => void runAction(row.id, "disable")}>
              Disable
            </button>
          ) : null}
        </td>
      </tr>
    ),
  });

  const policyRows: { key: keyof MfaPolicy; label: string; detail: string }[] = [
    { key: "requireMfaPlatformAdmins", label: "Require MFA for platform admins", detail: "Mandatory second factor for super-admin accounts" },
    { key: "requireMfaTenantAdmins", label: "Require MFA for tenant admins", detail: "Mandatory second factor for organization administrators" },
    { key: "allowTotp", label: "Allow TOTP authenticator apps", detail: "Google Authenticator, Microsoft Authenticator, etc." },
    { key: "allowSmsOtp", label: "Allow SMS / email OTP", detail: "One-time codes to registered contact methods" },
  ];

  return (
    <StandardPageLayout
      title="Multi-Factor Authentication"
      subtitle="Enforce and configure two-factor TOTP, SMS, and authenticator security protocols."
      eyebrow="Security / Authentication"
      icon="shield"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Enrollments", value: enrollments.length, helper: "records" },
            { label: "Enrolled", value: enrolledCount, tone: "positive" },
            { label: "Pending", value: enrollments.filter((e) => e.status === "Pending").length, tone: "warning" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          {list.headerTools}
          <ListCreateButton label="Add enrollment" onClick={() => setDrawerOpen(true)} />
        </>
      }
      filters={list.filterBar}
    >
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}

      <section className={erpPanelClassName}>
        <div className={erpPanelHeaderClassName}>
          <h2 className={erpPanelTitleClassName}>Policy controls</h2>
          {saving ? <span className="text-xs text-slate-500">Saving…</span> : null}
        </div>
        <div className={`${erpPanelBodyClassName} space-y-3`}>
          {policyRows.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-3 last:border-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-500">{item.detail}</p>
              </div>
              <Switch
                checked={policy[item.key]}
                disabled={loading}
                onCheckedChange={(checked) => void savePolicy({ ...policy, [item.key]: checked })}
                aria-label={item.label}
              />
            </div>
          ))}
        </div>
      </section>

      <CrudCard>{list.table}</CrudCard>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add MFA enrollment"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className={erpButtonClassName.secondary} onClick={() => setDrawerOpen(false)}>
              Cancel
            </button>
            <button type="button" className={erpButtonClassName.primary} disabled={creating} onClick={() => void handleCreate()}>
              {creating ? "Saving…" : "Create"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className={erpFormLabelClassName}>User *</label>
            <select className={`${erpFormInputClassName} mt-1`} value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName || u.email || u.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={erpFormLabelClassName}>Method</label>
            <select className={`${erpFormInputClassName} mt-1`} value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="TOTP">TOTP authenticator</option>
              <option value="SMS">SMS OTP</option>
              <option value="Email">Email OTP</option>
            </select>
          </div>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}

export default function MultiFactorAuthenticationPage() {
  return (
    <DynamicPage
      pageKey="security.multi-factor-authentication"
      fallback={<LegacyMultiFactorAuthenticationPage />}
      renderMode="auto"
    />
  );
}
