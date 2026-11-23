"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import PublicAuthAlert from "@/components/public/auth/PublicAuthAlert";
import PublicAuthCard, { PublicAuthFooterLink } from "@/components/public/auth/PublicAuthCard";
import { PublicAuthFormField, PublicAuthInput } from "@/components/public/auth/PublicAuthFormField";
import { publicButtonClassName } from "@/components/public/publicStyles";
import { getApiErrorMessage } from "@/lib/api-errors";
import { withPublicAudience, type PublicAudience } from "@/lib/public-audience";
import { cn } from "@/lib/utils";
import { authApi } from "@/services/modules";

export type PublicPasswordRecoveryCardProps = {
  audience: PublicAudience;
  initialMode?: "request" | "reset";
};

export default function PublicPasswordRecoveryCard({
  audience,
  initialMode,
}: PublicPasswordRecoveryCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlToken = useMemo(() => searchParams?.get("token")?.trim() ?? "", [searchParams]);

  // If a token is in the URL, always start in reset mode; otherwise follow initialMode or default to request
  const [mode, setMode] = useState<"request" | "reset">(() => {
    if (urlToken) return "reset";
    return initialMode === "reset" ? "reset" : "request";
  });

  // Request mode state
  const [email, setEmail] = useState("");
  const [requestState, setRequestState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [requestMessage, setRequestMessage] = useState("");

  // Reset mode state
  const [token, setToken] = useState(urlToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [manualTokenVisible, setManualTokenVisible] = useState(!urlToken);
  const [resetState, setResetState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [resetMessage, setResetMessage] = useState("");

  const emailFieldId = "recovery-email";

  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    return score;
  }, [newPassword]);

  // Handle Request Link Submission (Forgot Password)
  const handleRequestSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setRequestState("error");
      setRequestMessage("Please enter a valid work email address.");
      return;
    }

    setRequestState("submitting");
    setRequestMessage("");

    try {
      const response = await authApi.forgotPassword({ email: normalizedEmail });
      setRequestState("success");
      setRequestMessage(
        response.data?.message ||
          "If an account with this email exists, a password reset link has been sent to your inbox.",
      );
    } catch (error: unknown) {
      setRequestState("error");
      setRequestMessage(getApiErrorMessage(error, "Unable to start password recovery right now."));
    }
  };

  // Handle Set New Password Submission (Reset Password)
  const handleResetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const effectiveToken = token.trim() || urlToken;

    if (!effectiveToken) {
      setResetState("error");
      setResetMessage("Reset token is missing. Please request a new reset link via email.");
      return;
    }

    if (newPassword.length < 8) {
      setResetState("error");
      setResetMessage("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetState("error");
      setResetMessage("Passwords do not match. Please verify both fields.");
      return;
    }

    setResetState("submitting");
    setResetMessage("");

    try {
      const response = await authApi.resetPassword({ token: effectiveToken, newPassword });
      setResetState("success");
      setResetMessage(response.data?.message || "Password updated successfully. Redirecting to sign in...");
      window.setTimeout(() => {
        router.push(withPublicAudience("/login", audience));
      }, 1500);
    } catch (error: unknown) {
      setResetState("error");
      setResetMessage(getApiErrorMessage(error, "Unable to reset password. The link or token may have expired."));
    }
  };

  // -------------------------------------------------------------
  // Mode 1: Request Reset Link (Forgot Password)
  // -------------------------------------------------------------
  if (mode === "request") {
    return (
      <PublicAuthCard
        title="Forgot password"
        subtitle="Enter your registered work email and we'll send a secure password reset link to your inbox."
        footer={
          <div className="space-y-1.5">
            <div>
              Remember your password?{" "}
              <PublicAuthFooterLink href={withPublicAudience("/login", audience)}>Sign in</PublicAuthFooterLink>
            </div>
            <div>
              Already have a reset token or link?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("reset");
                  setManualTokenVisible(true);
                }}
                className="font-medium text-blue-600 hover:text-blue-700 dark:text-cyan-400 dark:hover:text-cyan-300 underline underline-offset-2"
              >
                Set new password
              </button>
            </div>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleRequestSubmit}>
          <PublicAuthFormField id={emailFieldId} label="Work email">
            <PublicAuthInput
              id={emailFieldId}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              type="email"
              autoFocus
              required
              icon={<Mail className="h-4 w-4" />}
            />
          </PublicAuthFormField>

          {requestMessage ? (
            <PublicAuthAlert tone={requestState === "error" ? "error" : "success"}>
              {requestMessage}
            </PublicAuthAlert>
          ) : null}

          {requestState === "success" ? (
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 text-xs leading-relaxed text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                Instructions dispatched
              </div>
              <p className="mt-1">
                Please check your inbox (and spam folder) and click the link inside to set a new password. The link is valid for 1 hour.
              </p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={requestState === "submitting" || requestState === "success"}
            className={cn(publicButtonClassName.primary, "w-full")}
          >
            {requestState === "submitting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending reset link...
              </>
            ) : (
              <>
                Send reset link
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </PublicAuthCard>
    );
  }

  // -------------------------------------------------------------
  // Mode 2: Set New Password (Reset Password)
  // -------------------------------------------------------------
  return (
    <PublicAuthCard
      title="Create new password"
      subtitle="Define a secure new password for your enterprise workspace account."
      footer={
        <div className="space-y-1.5">
          <div>
            Need a new reset link?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("request");
                setRequestMessage("");
                setRequestState("idle");
              }}
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-cyan-400 dark:hover:text-cyan-300 underline underline-offset-2"
            >
              Request reset email
            </button>
          </div>
          <div>
            Remember your credentials?{" "}
            <PublicAuthFooterLink href={withPublicAudience("/login", audience)}>Sign in</PublicAuthFooterLink>
          </div>
        </div>
      }
    >
      <form onSubmit={handleResetSubmit} className="space-y-4">
        {/* If token came from URL, show verified badge instead of raw token input */}
        {urlToken && !manualTokenVisible ? (
          <div className="flex items-center justify-between rounded-lg border border-blue-200/80 bg-blue-50/70 px-3 py-2 text-xs text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
              Security token verified from email link
            </span>
            <button
              type="button"
              onClick={() => setManualTokenVisible(true)}
              className="text-[11px] underline opacity-80 hover:opacity-100"
            >
              Edit token
            </button>
          </div>
        ) : null}

        {/* If no URL token or user chose to edit token manually */}
        {manualTokenVisible ? (
          <PublicAuthFormField
            id="reset-token"
            label="Security Token"
            hint={
              urlToken ? (
                <button
                  type="button"
                  onClick={() => setManualTokenVisible(false)}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Hide token
                </button>
              ) : null
            }
          >
            <PublicAuthInput
              id="reset-token"
              type="text"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Paste the token from your email"
              icon={<KeyRound className="h-4 w-4" />}
              required
            />
          </PublicAuthFormField>
        ) : null}

        <PublicAuthFormField id="reset-new-password" label="New password">
          <PublicAuthInput
            id="reset-new-password"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="At least 8 characters"
            icon={<LockKeyhole className="h-4 w-4" />}
            required
            autoFocus={Boolean(urlToken)}
            trailing={
              <button
                type="button"
                onClick={() => setShowNewPassword((value) => !value)}
                className="absolute right-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          {newPassword.length > 0 ? (
            <div className="space-y-1 pt-1">
              <div className="flex h-1.5 gap-1">
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className={cn(
                      "flex-1 rounded-full transition-colors",
                      bar <= passwordStrength
                        ? passwordStrength <= 2
                          ? "bg-amber-400"
                          : "bg-emerald-500"
                        : "bg-slate-200 dark:bg-slate-700",
                    )}
                  />
                ))}
              </div>
              <p className="text-[11px] text-slate-500">
                {passwordStrength <= 1
                  ? "Weak — mix uppercase, numbers, and symbols"
                  : passwordStrength <= 2
                    ? "Moderate — add numbers or special characters"
                    : passwordStrength <= 3
                      ? "Strong password"
                      : "Very strong password"}
              </p>
            </div>
          ) : null}
        </PublicAuthFormField>

        <PublicAuthFormField id="reset-confirm-password" label="Confirm password">
          <PublicAuthInput
            id="reset-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your new password"
            icon={<LockKeyhole className="h-4 w-4" />}
            required
            trailing={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute right-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
        </PublicAuthFormField>

        {resetMessage ? (
          <PublicAuthAlert tone={resetState === "error" ? "error" : "success"}>
            {resetMessage}
          </PublicAuthAlert>
        ) : null}

        <button
          type="submit"
          disabled={resetState === "submitting" || resetState === "success"}
          className={cn(publicButtonClassName.primary, "w-full")}
        >
          {resetState === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating password...
            </>
          ) : (
            <>
              Reset password
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </PublicAuthCard>
  );
}
