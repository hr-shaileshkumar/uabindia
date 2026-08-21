"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicAuthAlert from "@/components/public/PublicAuthAlert";
import PublicAuthCard, { PublicAuthFooterLink } from "@/components/public/PublicAuthCard";
import { PublicAuthFormField, PublicAuthInput } from "@/components/public/PublicAuthFormField";
import PublicAuthShell from "@/components/public/PublicAuthShell";
import { publicButtonClassName } from "@/components/public/publicStyles";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { useResolvedPublicAudience } from "@/hooks/useResolvedPublicAudience";
import { getApiErrorMessage } from "@/lib/api-errors";
import { withPublicAudience } from "@/lib/public-audience";
import { cn } from "@/lib/utils";
import { authApi } from "@/services/modules";

export default function ForgotPasswordPage() {
  const { audience } = useResolvedPublicAudience();
  const { profile, headerContent, footerContent, allowedPaths, pageVisible } =
    usePublicPageData("forgot-password", audience);

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "success" | "error" | "submitting">("idle");

  const emailFieldId = "forgot-password-email";

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setState("error");
      setMessage("Enter a valid work email.");
      return;
    }

    setState("submitting");
    setMessage("");

    try {
      const response = await authApi.forgotPassword({ email: normalizedEmail });
      setState("success");
      setMessage(
        response.data?.message ||
          "If an account with this email exists, reset instructions have been sent to your inbox.",
      );
    } catch (error: unknown) {
      setState("error");
      setMessage(getApiErrorMessage(error, "Unable to start password recovery right now."));
    }
  };

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
        variant="forgot-password"
      >
        <PublicAuthCard
          title="Forgot password"
          subtitle="Enter your work email and we'll send reset instructions if an account exists."
          footer={
            <>
              Remember your password?{" "}
              <PublicAuthFooterLink href={withPublicAudience("/login", audience)}>Sign in</PublicAuthFooterLink>
            </>
          }
        >
          <form className="space-y-4" onSubmit={onSubmit}>
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

            {message ? (
              <PublicAuthAlert tone={state === "error" ? "error" : "success"}>{message}</PublicAuthAlert>
            ) : null}

            <button
              type="submit"
              disabled={state === "submitting" || state === "success"}
              className={cn(publicButtonClassName.primary, "w-full")}
            >
              {state === "submitting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending instructions...
                </>
              ) : (
                <>
                  Send reset instructions
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </PublicAuthCard>
      </PublicAuthShell>
    </PublicAudiencePageFrame>
  );
}
