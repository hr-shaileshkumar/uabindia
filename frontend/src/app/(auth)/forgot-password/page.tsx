"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicAuthShell from "@/components/public/PublicAuthShell";
import { Input } from "@/components/ui/input";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { useResolvedPublicAudience } from "@/hooks/useResolvedPublicAudience";
import { getApiErrorMessage } from "@/lib/api-errors";
import { withPublicAudience } from "@/lib/public-audience";
import { authApi } from "@/services/modules";
import { Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const { audience } = useResolvedPublicAudience();
  const { profile, headerContent, footerContent, allowedPaths, pageVisible } = usePublicPageData("forgot-password", audience);

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
          "If an account with this email exists, reset instructions have been sent to your inbox."
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
      >
        <div className="relative w-full overflow-hidden rounded-2xl bg-white border border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-sm">
          {/* Top accent bar */}
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-500 via-orange-500 to-blue-600" />

          <div className="p-7 sm:p-9">
            {/* Header */}
            <div className="mb-7">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-amber-800">
                  Password Recovery
                </span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Reset your password
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {audience === "tenant"
                  ? "Enter your registered work email and we will send reset instructions to your inbox."
                  : "Use the email linked to your platform account. Reset instructions are sent securely."}
              </p>
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor={emailFieldId}>
                  Work email
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                  <Input
                    id={emailFieldId}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    type="email"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    style={{ paddingLeft: "2.75rem" }}
                    autoFocus
                    required
                  />
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

            <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
              Remember your password?{" "}
              <Link
                href={withPublicAudience("/login", audience)}
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </PublicAuthShell>
    </PublicAudiencePageFrame>
  );
}
