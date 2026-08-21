"use client";

import { UserCircle2 } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import {
  erpPanelClassName,
  erpPanelBodyClassName,
  erpSectionEyebrowClassName,
  erpStatCardClassName,
  erpStatCardLabelClassName,
  erpStatCardValueClassName,
  erpStatusBadgeTone,
} from "@/components/erp/erpStyles";
import { useAuth } from "@/context/AuthContext";
import { normalizeRole } from "@/lib/erp/access";

const formatRoleLabel = (role: string) =>
  role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatValue = (value?: string | null, fallback = "—") =>
  value && value.trim().length > 0 ? value : fallback;

export function AdministrationProfilePage() {
  const { user, loading } = useAuth();
  const normalizedRole = normalizeRole(user?.role);
  const roleLabels = (user?.roles?.length ? user.roles : [normalizedRole]).map(formatRoleLabel);

  return (
    <StandardPageLayout
      title="My Profile"
      subtitle="Account identity and workspace context from your signed-in session."
      eyebrow="Administration"
      icon="employees"
    >
      <div className={erpPanelClassName}>
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-start gap-4">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 object-cover"
              />
            ) : (
              <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
                <UserCircle2 className="h-7 w-7" />
              </span>
            )}
            <div className="min-w-0">
              <p className={erpSectionEyebrowClassName}>Signed-in user</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                {loading ? "Loading…" : formatValue(user?.fullName, user?.email || "Employee")}
              </h2>
              <p className="mt-0.5 text-sm text-slate-600">{formatValue(user?.email)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={erpStatusBadgeTone.info}>{formatRoleLabel(normalizedRole)}</span>
                <span className={user?.isActive === false ? erpStatusBadgeTone.danger : erpStatusBadgeTone.success}>
                  {user?.isActive === false ? "Inactive" : "Active"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={erpPanelBodyClassName}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className={erpStatCardClassName}>
              <p className={erpStatCardLabelClassName}>User ID</p>
              <p className={`${erpStatCardValueClassName} font-mono text-sm`}>{formatValue(user?.userId || user?.id)}</p>
            </div>
            <div className={erpStatCardClassName}>
              <p className={erpStatCardLabelClassName}>Tenant</p>
              <p className={`${erpStatCardValueClassName} text-sm`}>{formatValue(user?.tenantId, "From login context")}</p>
            </div>
            <div className={erpStatCardClassName}>
              <p className={erpStatCardLabelClassName}>Company</p>
              <p className={`${erpStatCardValueClassName} text-sm`}>{formatValue(user?.companyId, "From workspace context")}</p>
            </div>
          </div>

          {roleLabels.length > 0 ? (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className={erpStatCardLabelClassName}>Assigned roles</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {roleLabels.map((role) => (
                  <span key={role} className={erpStatusBadgeTone.neutral}>
                    {role}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </StandardPageLayout>
  );
}
