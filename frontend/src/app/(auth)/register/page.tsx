"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
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
import { publicApi } from "@/services/modules";
import { getTenantSubdomain } from "@/services/apiClient";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const isTenantContext = hasExplicitPublicTenantContext();
  const audience = useMemo(
    () => resolvePublicAudience(searchParams.get("audience"), isTenantContext),
    [isTenantContext, searchParams]
  );
  const { profile, headerContent, footerContent, allowedPaths, pageVisible, parseContent } = usePublicPageData("register", audience);
  const content = parseContent({
    title: "Request workspace access",
    subtitle:
      "New users are provisioned by an administrator. Share your details and access request here.",
    authEyebrow: "Invite-first access",
    authAsideTitle: "",
    authAsideBody: "",
    authBadges: ["Admin managed", "Clean onboarding"],
    submitLabel: "Request access",
  });

  return (
    <PublicAudiencePageFrame audience={audience} profile={profile} headerContent={headerContent} footerContent={footerContent} allowedPaths={allowedPaths} pageVisible={pageVisible} footerVariant="full">
      <PublicAuthShell>
        <RegisterAccessRequestForm
          audience={audience}
          profile={profile}
          profileName={profile.companyName || profile.brandName}
          submitLabel={content.submitLabel}
        />
      </PublicAuthShell>
    </PublicAudiencePageFrame>
  );
}

function RegisterAccessRequestForm({
  audience,
  profile,
  profileName,
  submitLabel,
}: {
  audience: PublicAudience;
  profile: ClientProfile;
  profileName: string;
  submitLabel: string;
}) {
  const detectedTenant = getTenantSubdomain() ?? "";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === "submitting") return;

    if (!fullName.trim() || !email.trim() || !message.trim()) {
      setState("error");
      setFeedback("Name, email, and request details are required.");
      return;
    }

    setState("submitting");
    setFeedback("");

    try {
      const response = await publicApi.submitContact({
        name: fullName.trim(),
        email: email.trim(),
        companyName: detectedTenant ? profileName : undefined,
        subject: "Portal access request",
        message: message.trim(),
      }, audience, "request-access");

      setState("success");
      setFeedback(response.data?.message || "Your access request has been routed to the support desk.");
      setFullName("");
      setEmail("");
      setMessage("");
    } catch (error: unknown) {
      setState("error");
      setFeedback(getApiErrorMessage(error, "Unable to submit the access request right now."));
    }
  };

  return (
    <LoginCard
      profile={profile}
      title="Request access"
      subtitle={detectedTenant ? "Share your details for admin approval." : "Share your details and the platform team will route the access request."}
      footer={
        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href={withPublicAudience("/login", audience)}
            className="font-medium text-[color:var(--erp-primary)]"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block text-sm font-semibold text-slate-900">
          Full name
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Ananya Sharma"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            required
          />
        </label>

        <label className="block text-sm font-semibold text-slate-900">
          Work email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            required
          />
        </label>

        <label className="block text-sm font-semibold text-slate-900">
          Request details
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Mention your role, department, and any access approvals needed."
            className="mt-2 min-h-32 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            required
          />
        </label>

        {feedback ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              state === "error"
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {feedback}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={state === "submitting"}
          className="inline-flex w-full items-center justify-center rounded-xl bg-[color:var(--erp-primary)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(11,79,140,0.18)] transition hover:bg-[color:var(--erp-primary-hover)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {state === "submitting" ? "Submitting..." : submitLabel}
        </button>
      </form>
    </LoginCard>
  );
}
