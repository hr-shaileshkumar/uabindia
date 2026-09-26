"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TenantWizard,
  buildTenantCreatePayload,
  getDefaultTenantForm,
} from "@/features/tenants/components/TenantWizard";
import type { TenantFormValues } from "@/features/tenants/types";
import apiClient from "@/services/apiClient";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  CheckCircle2,
  Building2,
  Copy,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface ProvisionResponse {
  tenantId?: string;
  subdomain?: string;
  provisioningStatus?: string;
  onboardingCredentials?: {
    adminEmail?: string;
    temporaryPassword?: string | null;
  };
  message?: string;
}

export default function CreateTenantPage() {
  const router = useRouter();
  const [createdTenant, setCreatedTenant] = useState<ProvisionResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleSubmit = async (values: TenantFormValues) => {
    try {
      const payload = buildTenantCreatePayload(values);
      const res = await apiClient.post<ProvisionResponse>("/tenants", payload);

      notifySuccess(res.data?.message || "Tenant provisioned successfully!");
      setCreatedTenant(res.data || { subdomain: values.subdomain });
    } catch (err) {
      const errorMsg = getApiErrorMessage(err, "Failed to provision tenant");
      notifyError(errorMsg);
      throw err;
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    notifySuccess(`Copied ${key} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (createdTenant) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="rounded-2xl border border-emerald-200 bg-white p-8 shadow-xl dark:border-emerald-900/50 dark:bg-slate-900 text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center dark:bg-emerald-950/50 dark:text-emerald-400">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Tenant Provisioned Successfully!
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your organization workspace has been created and baseline chart of accounts and roles are initialized.
            </p>
          </div>

          {/* Credentials Summary Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-left space-y-3 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Workspace Access Credentials</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                <span className="text-slate-500">Subdomain:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{createdTenant.subdomain}</span>
                  <button
                    onClick={() => copyToClipboard(createdTenant.subdomain || "", "Subdomain")}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {createdTenant.onboardingCredentials?.adminEmail && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                  <span className="text-slate-500">Admin Email:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {createdTenant.onboardingCredentials.adminEmail}
                    </span>
                    <button
                      onClick={() => copyToClipboard(createdTenant.onboardingCredentials?.adminEmail || "", "Admin Email")}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {createdTenant.onboardingCredentials?.temporaryPassword && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                  <span className="text-slate-500">Temporary Password:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {createdTenant.onboardingCredentials.temporaryPassword}
                    </span>
                    <button
                      onClick={() => copyToClipboard(createdTenant.onboardingCredentials?.temporaryPassword || "", "Password")}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => router.push("/administration/tenants")}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition inline-flex items-center justify-center gap-2"
            >
              <span>Go to Tenants Directory</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setCreatedTenant(null);
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 inline-flex items-center justify-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Create Another Tenant</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Tenant Onboarding Wizard
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Create an isolated organization workspace with automatic role seeding and subscription configuration.
            </p>
          </div>
        </div>
      </div>

      <TenantWizard
        mode="create"
        onCancel={() => router.push("/administration/tenants")}
        onSubmit={handleSubmit}
        submitLabel="Provision Tenant Workspace"
      />
    </div>
  );
}