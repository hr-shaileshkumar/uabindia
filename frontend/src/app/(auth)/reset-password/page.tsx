"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, KeyRound, Loader2, LockKeyhole } from "lucide-react";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicAuthAlert from "@/components/public/PublicAuthAlert";
import PublicAuthCard, { PublicAuthFooterLink } from "@/components/public/PublicAuthCard";
import { PublicAuthFormField, PublicAuthInput } from "@/components/public/PublicAuthFormField";
import PublicAuthShell from "@/components/public/PublicAuthShell";
import { publicButtonClassName } from "@/components/public/publicStyles";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { useResolvedPublicAudience } from "@/hooks/useResolvedPublicAudience";
import { getApiErrorMessage } from "@/lib/api-errors";
import { withPublicAudience, type PublicAudience } from "@/lib/public-audience";
import { cn } from "@/lib/utils";
import { authApi } from "@/services/modules";

export default function ResetPasswordPage() {
  const { audience } = useResolvedPublicAudience();
  const { profile, headerContent, footerContent, allowedPaths, pageVisible } =
    usePublicPageData("reset-password", audience);

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
        brandName={profile.brandName || profile.companyName || process.env.NEXT_PUBLIC_APP_NAME || "Enterprise ERP"}
        homeHref={withPublicAudience("/", audience)}
        audience={audience}
        variant="reset-password"
        profile={profile}
        headerContent={headerContent}
        allowedPaths={allowedPaths}
      >
        <ResetPasswordForm audience={audience} />
      </PublicAuthShell>
    </PublicAudiencePageFrame>
  );
}

function ResetPasswordForm({ audience }: { audience: PublicAudience }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = useMemo(() => searchParams?.get("token") ?? "", [searchParams]);
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
    <PublicAuthCard
      title="Create new password"
      subtitle="Paste your reset token and choose a secure password."
      footer={
        <>
          Need a new token?{" "}
          <PublicAuthFooterLink href={withPublicAudience("/forgot-password", audience)}>
            Request reset email
          </PublicAuthFooterLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <PublicAuthFormField id="reset-token" label="Reset token">
          <PublicAuthInput
            id="reset-token"
            type="text"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Paste your security token"
            icon={<KeyRound className="h-4 w-4" />}
            required
          />
        </PublicAuthFormField>

        <PublicAuthFormField id="reset-new-password" label="New password">
          <PublicAuthInput
            id="reset-new-password"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="At least 8 characters"
            icon={<LockKeyhole className="h-4 w-4" />}
            required
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
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={cn(
                      "h-full flex-1 rounded-full",
                      passwordStrength >= step
                        ? passwordStrength <= 2
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                        : "bg-slate-200",
                    )}
                  />
                ))}
              </div>
              <p className="text-right text-xs text-slate-500">
                {passwordStrength <= 1 ? "Weak" : passwordStrength <= 3 ? "Fair" : "Strong"}
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
            placeholder="Repeat new password"
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

        {message ? <PublicAuthAlert tone={state === "error" ? "error" : "success"}>{message}</PublicAuthAlert> : null}

        <button
          type="submit"
          disabled={state === "submitting" || state === "success"}
          className={cn(publicButtonClassName.primary, "w-full")}
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
    </PublicAuthCard>
  );
}
