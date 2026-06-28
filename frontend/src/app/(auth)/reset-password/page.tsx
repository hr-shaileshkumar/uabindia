"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import LoginCard from "@/components/auth/LoginCard";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicAuthShell from "@/components/public/PublicAuthShell";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  hasExplicitPublicTenantContext,
  resolvePublicAudience,
  withPublicAudience,
  type PublicAudience,
} from "@/lib/public-audience";
import type { ClientProfile } from "@/lib/publicProfile";
import apiClient from "@/services/apiClient";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const isTenantContext = hasExplicitPublicTenantContext();
  const audience = useMemo(
    () => resolvePublicAudience(searchParams.get("audience"), isTenantContext),
    [isTenantContext, searchParams]
  );
  const { profile, headerContent, footerContent, allowedPaths, pageVisible, parseContent } = usePublicPageData("reset-password", audience);
  const content = parseContent({
    title: "Set a new password",
    subtitle:
      "Enter the reset token from your email and choose a new password.",
    authEyebrow: "Set a new password",
    authAsideTitle: "",
    authAsideBody: "",
    authBadges: ["Secure reset", "Sign in again"],
    submitLabel: "Reset password",
  });

  return (
    <PublicAudiencePageFrame audience={audience} profile={profile} headerContent={headerContent} footerContent={footerContent} allowedPaths={allowedPaths} pageVisible={pageVisible} footerVariant="full">
      <PublicAuthShell>
        <ResetPasswordForm audience={audience} profile={profile} submitLabel={content.submitLabel} />
      </PublicAuthShell>
    </PublicAudiencePageFrame>
  );
}

function ResetPasswordForm({
  audience,
  profile,
  submitLabel,
}: {
  audience: PublicAudience;
  profile: ClientProfile;
  submitLabel: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === "submitting") return;
    if (newPassword.length < 8) {
      setState("error");
      setMessage("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setState("error");
      setMessage("Password confirmation does not match.");
      return;
    }

    setState("submitting");
    setMessage("");

    try {
      const response = await apiClient.post("/auth/reset-password", {
        token,
        newPassword,
      });
      setState("success");
      setMessage(response.data?.message || "Password has been reset successfully.");
      window.setTimeout(() => router.push(withPublicAudience("/login", audience)), 1200);
    } catch (error: unknown) {
      setState("error");
      setMessage(getApiErrorMessage(error, "Unable to reset password. Check the token and try again."));
    }
  };

  return (
    <LoginCard
      profile={profile}
      title="Create new password"
      subtitle="Use the token from your email to complete password recovery."
      footer={
        <p className="text-center text-sm text-slate-500">
          Need a new token?{" "}
          <Link
            href={withPublicAudience("/forgot-password", audience)}
            className="font-medium text-[color:var(--erp-primary)]"
          >
            Request another reset email
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block text-sm font-semibold text-slate-900">
          Reset token
          <input
            type="text"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Paste your reset token"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            required
          />
        </label>

        <label className="block text-sm font-semibold text-slate-900">
          New password
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="At least 8 characters"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            required
          />
        </label>

        <label className="block text-sm font-semibold text-slate-900">
          Confirm password
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat the new password"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            required
          />
        </label>

        {message ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              state === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={state === "submitting"}
          className="inline-flex w-full items-center justify-center rounded-xl bg-[color:var(--erp-primary)] px-4 py-3 font-semibold text-white shadow-[0_14px_32px_rgba(11,79,140,0.18)] transition hover:bg-[color:var(--erp-primary-hover)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {state === "submitting" ? "Resetting..." : submitLabel}
        </button>
      </form>
    </LoginCard>
  );
}
