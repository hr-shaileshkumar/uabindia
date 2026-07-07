"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import LoginCard from "@/components/auth/LoginCard";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicAuthShell from "@/components/public/PublicAuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { useResolvedPublicAudience } from "@/hooks/useResolvedPublicAudience";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  withPublicAudience,
  type PublicAudience,
} from "@/lib/public-audience";
import type { ClientProfile } from "@/lib/publicProfile";
import { authApi } from "@/services/modules";

export default function ResetPasswordPage() {
  const { audience } = useResolvedPublicAudience();
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
      <PublicAuthShell
        eyebrow={content.authEyebrow}
        title="Set a fresh password"
        description="Finish password recovery with the reset token from your email. Choose a password you can safely use for daily workspace access."
        badges={content.authBadges}
      >
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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      const response = await authApi.resetPassword({
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
      eyebrow="Create a new password"
      align="left"
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
          <Input
            type="text"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Paste your reset token"
            className="mt-2"
            required
          />
        </label>

        <label className="block text-sm font-semibold text-slate-900">
          New password
          <div className="relative mt-2">
            <Input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((value) => !value)}
              className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={showNewPassword ? "Hide new password" : "Show new password"}
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <label className="block text-sm font-semibold text-slate-900">
          Confirm password
          <div className="relative mt-2">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat the new password"
              className="pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
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

        <Button
          type="submit"
          disabled={state === "submitting"}
          className="w-full"
        >
          {state === "submitting" ? "Resetting..." : submitLabel}
        </Button>
      </form>
    </LoginCard>
  );
}
