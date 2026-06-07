"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, KeyRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import PublicAuthShell from "@/components/public/PublicAuthShell";
import PublicSiteFrame from "@/components/public/PublicSiteFrame";
import { publicMutedPanelClassName, publicPanelClassName } from "@/components/public/publicStyles";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { getApiErrorMessage } from "@/lib/api-errors";
import apiClient from "@/services/apiClient";

export default function ResetPasswordPage() {
  const { profile, headerContent, footerContent, parseContent } = usePublicPageData("reset-password");
  const content = parseContent({
    title: "Finish the recovery flow with a new secure password",
    subtitle:
      "Use the reset token from your recovery email. This page completes the frontend flow for the existing backend reset endpoint.",
    authEyebrow: "Set a new password",
    authAsideTitle: "What happens next",
    authAsideBody:
      "Explain that active sessions are revoked and that the user should sign in again after a successful reset.",
    authBadges: ["Reset token supported", "Revokes old sessions", "Enterprise-safe flow"],
    submitLabel: "Reset password",
  });

  return (
    <PublicSiteFrame profile={profile} headerContent={headerContent} footerContent={footerContent}>
      <PublicAuthShell
        profile={profile}
        eyebrow={content.authEyebrow}
        title={content.title}
        subtitle={content.subtitle}
        badges={content.authBadges}
        asideTitle={content.authAsideTitle}
        asideBody={content.authAsideBody}
        metrics={[
          { label: "Minimum", value: "8 characters" },
          { label: "Session impact", value: "Revoked" },
          { label: "Next step", value: "Sign in again" },
        ]}
      >
        <ResetPasswordForm submitLabel={content.submitLabel} />
      </PublicAuthShell>
    </PublicSiteFrame>
  );
}

function ResetPasswordForm({ submitLabel }: { submitLabel: string }) {
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
      window.setTimeout(() => router.push("/login"), 1200);
    } catch (error: unknown) {
      setState("error");
      setMessage(getApiErrorMessage(error, "Unable to reset password. Check the token and try again."));
    }
  };

  return (
    <div className={`${publicPanelClassName} p-7 sm:p-8`}>
      <div className="mb-7 flex items-center gap-3">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#0b4f8c,#0f6fa8)] text-white shadow-[0_14px_30px_rgba(11,79,140,0.2)]">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Create a new password</h2>
          <p className="text-sm text-slate-600">Paste the token from your email and choose a new password.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block text-sm font-semibold text-slate-900">
          Reset token
          <input
            type="text"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Paste your reset token"
            className="mt-2 w-full rounded-[1.15rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
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
            className="mt-2 w-full rounded-[1.15rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
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
            className="mt-2 w-full rounded-[1.15rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            required
          />
        </label>

        {message ? (
          <div
            className={`rounded-[1.15rem] border px-4 py-3 text-sm ${
              state === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {message}
          </div>
        ) : null}

        <div className="flex justify-center pt-1">
        <button
          type="submit"
          disabled={state === "submitting"}
          className="inline-flex min-w-[14rem] items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#0b4f8c,#0f6fa8)] px-8 py-3 font-semibold text-white shadow-[0_16px_40px_rgba(11,79,140,0.2)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {state === "submitting" ? "Resetting..." : submitLabel}
          {state === "submitting" ? null : <ArrowRight className="h-4 w-4" />}
        </button>
        </div>
      </form>

      <div className={`${publicMutedPanelClassName} mt-6 p-4`}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-slate-500" />
          <p className="text-sm leading-6 text-slate-600">
            Successful reset will invalidate active refresh sessions so the account can re-enter cleanly.
          </p>
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-slate-600">
        Need a new token?{" "}
        <Link href="/forgot-password" className="font-semibold text-(--erp-primary) hover:text-(--erp-primary-hover)">
          Request another reset email
        </Link>
      </p>
    </div>
  );
}
