"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { TenantWizard, buildTenantUpdatePayload } from "@/features/companies/TenantWizard";
import { platformApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import type { TenantDto, TenantFormValues } from "@/features/companies/types";
import { buildTenantFormFromDto, getErrorMessage, parseTenant } from "@/features/companies/tenant-utils";

export default function EditTenantPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params?.id as string;
  const [tenant, setTenant] = useState<TenantDto | null>(null);
  const [initialValues, setInitialValues] = useState<TenantFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await platformApi.admin.tenants();
        const row = Array.isArray(res.data?.tenants)
          ? (res.data.tenants as Record<string, unknown>[]).map(parseTenant).find((item) => item.id === tenantId)
          : undefined;

        if (!row) {
          throw new Error("Tenant not found.");
        }

        const baseForm = buildTenantFormFromDto(row);
        if (typeof window !== "undefined") {
          const draft = window.localStorage.getItem(`tenant-edit-draft-${row.id}`);
          if (draft) {
            try {
              setInitialValues({ ...baseForm, ...JSON.parse(draft) });
              setTenant(row);
              return;
            } catch {
              window.localStorage.removeItem(`tenant-edit-draft-${row.id}`);
            }
          }
        }

        setTenant(row);
        setInitialValues(baseForm);
      } catch (err) {
        const message = getErrorMessage(err, "Failed to load tenant.");
        setError(message);
        notifyError(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error ?? "Tenant not found."}
      </div>
    );
  }

  return (
    <StandardPageLayout
      title="Edit Tenant"
      subtitle={`Update tenant settings, billing, modules, and admin details for ${tenant.name}.`}
      eyebrow="Platform / Tenant"
      actions={
        <Button variant="secondary" onClick={() => router.push("/platform/tenants")}>Back to Tenant List</Button>
      }
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <TenantWizard
          mode="edit"
          initialValues={initialValues ?? buildTenantFormFromDto(tenant)}
          systemMeta={{ tenantId: tenant.id, createdAt: tenant.createdAt }}
          onSaveDraft={async (values) => {
            if (typeof window !== "undefined") {
              window.localStorage.setItem(`tenant-edit-draft-${tenant.id}`, JSON.stringify(values));
            }
            notifySuccess("Tenant draft saved.");
          }}
          onCancel={() => router.push("/platform/tenants")}
          onSubmit={async (values) => {
            const payload = buildTenantUpdatePayload(values);
            await platformApi.admin.updateTenant(tenant.id, payload);
            if (typeof window !== "undefined") {
              window.localStorage.removeItem(`tenant-edit-draft-${tenant.id}`);
            }
            notifySuccess("Tenant updated successfully.");
            router.push("/platform/tenants");
          }}
          submitLabel="Update Tenant"
          lockSystemFields
        />
      </div>
    </StandardPageLayout>
  );
}
