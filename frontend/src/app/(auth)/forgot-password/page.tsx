"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, LifeBuoy, MailCheck } from "lucide-react";
import PublicAuthShell from "@/components/public/PublicAuthShell";
import PublicSiteFrame from "@/components/public/PublicSiteFrame";
import { publicMutedPanelClassName, publicPanelClassName } from "@/components/public/publicStyles";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { getApiErrorMessage } from "@/lib/api-errors";
import apiClient from "@/services/apiClient";

export default function ForgotPasswordPage() {
  const { profile, headerContent, footerContent, parseContent } = usePublicPageData("forgot-password");
  const content = parseContent({
    title: "Recover access without contacting support first",
    subtitle:
      "Submit your business email to request password reset instructions. The response is intentionally generic for account security.",
    authEyebrow: "Password recovery",
    authAsideTitle: "How recovery works",
    authAsideBody:
      "Use this page to explain the recovery flow and reassure users that account security is preserved.",
    authBadges: ["Recovery flow live", "Backend-connected", "Security-first messaging"],
    submitLabel: "Send reset instructions",
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
          { label: "Token window", value: "1 hour" },
          { label: "Flow", value: "Email-based" },
          { label: "Fallback", value: "Support desk" },
        ]}
      >
        <ForgotPasswordForm submitLabel={content.submitLabel} />
      </PublicAuthShell>
    </PublicSiteFrame>
  );
}

function ForgotPasswordForm({ submitLabel }: { submitLabel: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === "submitting") return;
    setState("submitting");
    setMessage("");

    try {
      const response = await apiClient.post("/auth/forgot-password", { email });
      setState("success");
      setMessage(
        response.data?.message ||
          "If an account with this email exists, you will receive password reset instructions."
      );
    } catch (error: unknown) {
      setState("error");
      setMessage(getApiErrorMessage(error, "Unable to submit your reset request right now."));
    }
  };

  return (
    <div className={`${publicPanelClassName} p-7 sm:p-8`}>
      <div className="mb-7 flex items-center gap-3">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#0b4f8c,#0f6fa8)] text-white shadow-[0_14px_30px_rgba(11,79,140,0.2)]">
          <MailCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Request reset instructions</h2>
          <p className="text-sm text-slate-600">Enter the business email associated with your account.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block text-sm font-semibold text-slate-900">
          Work email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
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
          className="inline-flex min-w-[16rem] items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#0b4f8c,#0f6fa8)] px-8 py-3 font-semibold text-white shadow-[0_16px_40px_rgba(11,79,140,0.2)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {state === "submitting" ? "Submitting..." : submitLabel}
          {state === "submitting" ? null : <ArrowRight className="h-4 w-4" />}
        </button>
        </div>
      </form>

      <div className={`${publicMutedPanelClassName} mt-6 p-4`}>
        <div className="flex items-start gap-3">
          <LifeBuoy className="mt-0.5 h-4 w-4 text-slate-500" />
          <p className="text-sm leading-6 text-slate-600">
            If email delivery is not configured in your environment yet, support can still guide manual recovery.
          </p>
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-slate-600">
        Remembered your password?{" "}
        <Link href="/login" className="font-semibold text-(--erp-primary) hover:text-(--erp-primary-hover)">
          Back to login
        </Link>
      </p>
    </div>
  );
}
