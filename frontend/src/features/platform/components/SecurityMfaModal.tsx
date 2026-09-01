"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  QrCode,
  CheckCircle2,
  Copy,
  AlertTriangle,
  Lock,
  Smartphone,
  Globe2,
  X,
  ExternalLink,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import apiClient from "@/services/apiClient";
import { notifySuccess, notifyError } from "@/lib/notifications";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type MfaStatus = {
  mfaEnabled: boolean;
  mfaType: string;
  ssoProviders: Array<{
    id: string;
    name: string;
    status: string;
    domain: string;
    enabled: boolean;
  }>;
  lastVerifiedAt?: string;
};

type SetupResponse = {
  secretKey: string;
  qrUri: string;
  recoveryCodes: string[];
  message: string;
};

export function SecurityMfaModal({ open, onOpenChange }: Props) {
  const [activeTab, setActiveTab] = useState<"2fa" | "sso">("2fa");
  const [step, setStep] = useState<"status" | "setup" | "backup">("status");
  const [setupData, setSetupData] = useState<SetupResponse | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);

  const { data: status, refetch } = useQuery<MfaStatus>({
    queryKey: ["mfa", "status"],
    queryFn: async () => {
      const res = await apiClient.get("/mfa/status");
      return res.data;
    },
    enabled: open,
  });

  const startSetupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/mfa/setup");
      return res.data as SetupResponse;
    },
    onSuccess: (data) => {
      setSetupData(data);
      setStep("setup");
    },
    onError: () => {
      notifyError("Failed to initiate 2FA setup.");
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiClient.post("/mfa/verify", { code });
      return res.data;
    },
    onSuccess: () => {
      notifySuccess("Two-Factor Authentication activated successfully!");
      setStep("backup");
      void refetch();
    },
    onError: () => {
      notifyError("Invalid verification code. Please enter the 6-digit pin from your app.");
    },
  });

  const disableMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/mfa/disable");
      return res.data;
    },
    onSuccess: () => {
      notifySuccess("2FA has been disabled.");
      setStep("status");
      void refetch();
    },
  });

  const handleCopyKey = () => {
    if (setupData?.secretKey) {
      navigator.clipboard.writeText(setupData.secretKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        {/* Header */}
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Enterprise Security & Access Governance
                </h3>
                <p className="text-[11px] text-slate-500">
                  Multi-Factor Authentication (2FA) & Federated SSO Settings
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="mt-4 flex gap-1 border-t border-slate-200/60 pt-3 text-xs font-semibold text-slate-500 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab("2fa");
                setStep("status");
              }}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeTab === "2fa"
                  ? "bg-white text-indigo-600 shadow-xs font-bold dark:bg-slate-800 dark:text-indigo-400"
                  : "hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Two-Factor Auth (TOTP)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sso")}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeTab === "sso"
                  ? "bg-white text-indigo-600 shadow-xs font-bold dark:bg-slate-800 dark:text-indigo-400"
                  : "hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Enterprise SSO Providers
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {activeTab === "2fa" && (
            <div className="space-y-6">
              {step === "status" && (
                <div className="space-y-5">
                  <div className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                          status?.mfaEnabled
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                            : "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                        }`}
                      >
                        {status?.mfaEnabled ? (
                          <ShieldCheck className="h-5 w-5" />
                        ) : (
                          <ShieldAlert className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {status?.mfaEnabled
                            ? "Two-Factor Authentication is Active"
                            : "Two-Factor Authentication is Disabled"}
                        </h4>
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                          {status?.mfaEnabled
                            ? "Your account is protected with time-based one-time password (TOTP) verification."
                            : "Protect your account from unauthorized access by requiring a verification code when signing in."}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        status?.mfaEnabled
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                      }`}
                    >
                      {status?.mfaEnabled ? "Protected" : "Vulnerable"}
                    </span>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    {status?.mfaEnabled ? (
                      <button
                        type="button"
                        onClick={() => disableMutation.mutate()}
                        disabled={disableMutation.isPending}
                        className="rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-600 shadow-2xs hover:bg-rose-50"
                      >
                        Disable 2FA
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startSetupMutation.mutate()}
                        disabled={startSetupMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95"
                      >
                        <Smartphone className="h-4 w-4" />
                        <span>Enable Authenticator 2FA</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {step === "setup" && setupData && (
                <div className="space-y-5">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Step 1: Scan QR Code in your Authenticator App
                    </p>
                    <p className="mt-0.5">
                      Open Google Authenticator or Microsoft Authenticator and scan this code.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-sm">
                      <QrCode className="h-32 w-32 text-slate-900" />
                    </div>

                    <div className="space-y-3 min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Cannot scan QR? Enter manual key:
                      </p>
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <span className="truncate flex-1">{setupData.secretKey}</span>
                        <button
                          type="button"
                          onClick={handleCopyKey}
                          className="text-indigo-600 hover:text-indigo-700 font-sans font-bold text-[11px]"
                        >
                          {copiedKey ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 dark:text-white">
                      Step 2: Enter 6-digit OTP code to verify
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-center font-mono text-lg font-bold tracking-widest text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("status")}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => verifyMutation.mutate(otpCode)}
                      disabled={otpCode.length !== 6 || verifyMutation.isPending}
                      className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Verify & Activate 2FA
                    </button>
                  </div>
                </div>
              )}

              {step === "backup" && setupData && (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-900 dark:border-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span className="text-xs font-bold">Two-Factor Authentication is now Active!</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Save your Emergency Recovery Codes
                    </p>
                    <p className="text-[11px] text-slate-500">
                      If you lose access to your authenticator app, these one-time codes are the only way to regain access.
                    </p>
                    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center font-mono text-xs font-bold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                      {setupData.recoveryCodes.map((code) => (
                        <div key={code} className="rounded-lg bg-white p-2 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("status");
                        onOpenChange(false);
                      }}
                      className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700"
                    >
                      Done & Protected
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "sso" && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500">
                Federated Single Sign-On (SSO) allows corporate staff to log in using enterprise directory credentials.
              </div>

              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                {status?.ssoProviders?.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Globe2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</p>
                        <p className="text-[11px] font-mono text-slate-400">{p.domain}</p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
