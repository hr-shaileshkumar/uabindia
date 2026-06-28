"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import LoginCard from "@/components/auth/LoginCard";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicAuthShell from "@/components/public/PublicAuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  hasExplicitPublicTenantContext,
  resolvePublicAudience,
  withPublicAudience,
} from "@/lib/public-audience";
import apiClient from "@/services/apiClient";

const schema = {
  email: (value: string) => /\S+@\S+\.\S+/.test(value),
};

type ForgotPasswordContent = {
  title: string;
  subtitle: string;
  authEyebrow: string;
  authAsideTitle: string;
  authAsideBody: string;
  authBadges: string[];
  submitLabel: string;
};

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const isTenantContext = hasExplicitPublicTenantContext();
  const audience = useMemo(
    () => resolvePublicAudience(searchParams.get("audience"), isTenantContext),
    [isTenantContext, searchParams]
  );
  const { profile, headerContent, footerContent, allowedPaths, pageVisible, parseContent } = usePublicPageData("forgot-password", audience);
  const content = parseContent<ForgotPasswordContent>({
    title: "Forgot password",
    subtitle:
      "Enter your work email and we will send reset instructions if the account exists.",
    authEyebrow: "Password recovery",
    authAsideTitle: "",
    authAsideBody: "",
    authBadges: ["Secure reset", "Email delivery"],
    submitLabel: "Send reset instructions",
  });
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "success" | "error" | "submitting">("idle");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!schema.email(normalizedEmail)) {
      setState("error");
      setMessage("Enter a valid work email.");
      return;
    }

    setState("submitting");
    setMessage("");

    try {
      const response = await apiClient.post("/auth/forgot-password", { email: normalizedEmail });
      setState("success");
      setMessage(
        response.data?.message ||
          "If an account with this email exists, you will receive password reset instructions."
      );
    } catch (error: unknown) {
      setState("error");
      setMessage(getApiErrorMessage(error, "Unable to start password recovery right now."));
    }
  };

  return (
    <PublicAudiencePageFrame audience={audience} profile={profile} headerContent={headerContent} footerContent={footerContent} allowedPaths={allowedPaths} pageVisible={pageVisible} footerVariant="full">
      <PublicAuthShell>
        <LoginCard
          profile={profile}
          title="Reset your password"
          subtitle={isTenantContext ? "We will send reset instructions to your work email." : "Use the email linked to your workspace account."}
          footer={
            <div className="text-center text-sm text-slate-500">
              Back to{" "}
              <Link href={withPublicAudience("/login", audience)} className="font-medium text-[color:var(--erp-primary)]">
                login
              </Link>
            </div>
          }
        >
          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label className="erp-label">Email address</label>
              <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" type="email" />
            </div>

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

            <p className="text-sm leading-6 text-slate-500">
              If the account exists, the reset link will be delivered to the registered email.
            </p>

            <Button type="submit" disabled={state === "submitting"} className="w-full">
              {state === "submitting" ? "Sending..." : content.submitLabel}
            </Button>
          </form>
        </LoginCard>
      </PublicAuthShell>
    </PublicAudiencePageFrame>
  );
}
