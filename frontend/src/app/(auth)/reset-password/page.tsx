"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, KeyRound, LockKeyhole, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicAuthShell from "@/components/public/PublicAuthShell";
import { Input } from "@/components/ui/input";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { useResolvedPublicAudience } from "@/hooks/useResolvedPublicAudience";
import { getApiErrorMessage } from "@/lib/api-errors";
import { withPublicAudience, type PublicAudience } from "@/lib/public-audience";
import { authApi } from "@/services/modules";

export default function ResetPasswordPage() {
  const { audience } = useResolvedPublicAudience();
  const { profile, headerContent, footerContent, allowedPaths, pageVisible } = usePublicPageData("reset-password", audience);

  return (
    <PublicAudiencePageFrame
      audience={audience}
      profile={profile}
      headerContent={headerContent}
      footerContent={footerContent}
      allowedPaths={allowedPaths}
      pageVisible={pageVisible}
      showHeader={false}
      showFooter={false}
    >
      <PublicAuthShell
        brandName={profile.brandName || profile.companyName || "UabIndia ERP"}
        homeHref={withPublicAudience("/", audience)}
        audience={audience}
      >
        <ResetPasswordForm audience={audience} />
      </PublicAuthShell>
    </PublicAudiencePageFrame>
  );
}

function ResetPasswordForm({ audience }: { audience: PublicAudience }) {
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

  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    return score;
  }, [newPassword]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === "submitting") return;

    if (newPassword.length < 8) {
      setState("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setState("error");
      setMessage("Passwords do not match.");
      return;
    }

    setState("submitting");
    setMessage("");

    try {
      const response = await authApi.resetPassword({ token, newPassword });
      setState("success");
      setMessage(response.data?.message || "Password reset successfully. Redirecting to sign in...");
      window.setTimeout(() => router.push(withPublicAudience("/login", audience)), 1500);
    } catch (error: unknown) {
      setState("error");
      setMessage(getApiErrorMessage(error, "Unable to reset password. Check the token and try again."));
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-white border border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-sm">
      {/* Top accent bar */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-600" />

      <div className="p-7 sm:p-9">
        {/* Header */}
        <div className="mb-7">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-blue-700">
              Secure Reset
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Create new password
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Enter your reset token and choose a strong new password to regain access.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reset token */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Reset token
            </label>
            <div className="relative flex items-center">
              <KeyRound className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none z-10" />
              <Input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your security token"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                style={{ paddingLeft: "2.75rem" }}
                required
              />
            </div>
          </div>

          {/* New password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              New password
            </label>
            <div className="relative flex items-center">
              <LockKeyhole className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none z-10" />
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute right-3.5 rounded-lg p-1 text-slate-400 hover:text-slate-600 transition-colors z-10"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password strength meter */}
            {newPassword.length > 0 && (
              <div className="pt-1.5 space-y-1">
                <div className="flex h-1.5 w-full gap-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength >= step
                          ? passwordStrength <= 2
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                          : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[0.68rem] text-right font-medium text-slate-400">
                  {passwordStrength <= 1 ? "Weak" : passwordStrength <= 3 ? "Fair" : "Strong"}
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Confirm password
            </label>
            <div className="relative flex items-center">
              <LockKeyhole className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none z-10" />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3.5 rounded-lg p-1 text-slate-400 hover:text-slate-600 transition-colors z-10"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {message ? (
            <div
              className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs font-semibold leading-relaxed ${
                state === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {state === "success" && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />}
              <span>{message}</span>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={state === "submitting" || state === "success"}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]"
          >
            {state === "submitting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Resetting password...
              </>
            ) : (
              <>
                Reset password
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
          Need a new token?{" "}
          <Link
            href={withPublicAudience("/forgot-password", audience)}
            className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            Request reset email
          </Link>
        </div>
      </div>
    </div>
  );
}

