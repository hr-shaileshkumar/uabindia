"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicAuthShell from "@/components/public/PublicAuthShell";
import { Input } from "@/components/ui/input";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { useResolvedPublicAudience } from "@/hooks/useResolvedPublicAudience";
import { getApiErrorMessage } from "@/lib/api-errors";
import { withPublicAudience, type PublicAudience } from "@/lib/public-audience";
import { publicApi } from "@/services/modules";
import { getTenantSubdomain } from "@/services/apiClient";
import { User, Mail, MessageSquare, Loader2, CheckCircle2, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const { audience } = useResolvedPublicAudience();
  const { profile, headerContent, footerContent, allowedPaths, pageVisible } = usePublicPageData("register", audience);

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
        <RegisterAccessRequestForm
          audience={audience}
          profileName={profile.companyName || profile.brandName}
        />
      </PublicAuthShell>
    </PublicAudiencePageFrame>
  );
}

function RegisterAccessRequestForm({
  audience,
  profileName,
}: {
  audience: PublicAudience;
  profileName: string;
}) {
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
      const response = await publicApi.submitContact(
        {
          name: fullName.trim(),
          email: email.trim(),
          companyName: getTenantSubdomain() ? profileName : undefined,
          subject: "Portal access request",
          message: message.trim(),
        },
        audience,
        "request-access"
      );
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
    <div className="relative w-full overflow-hidden rounded-2xl bg-white border border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-sm">
      {/* Top accent bar */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-600" />

      <div className="p-7 sm:p-9">
        {/* Header */}
        <div className="mb-7">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-blue-700">
              Invite-First Access
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Request workspace access
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {audience === "tenant"
              ? "Submit your organization credentials for administrator review and account provisioning."
              : "Submit your details and our platform governance team will process your workspace access request."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="register-name">
              Full name
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none z-10" />
              <Input
                id="register-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ananya Sharma"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                style={{ paddingLeft: "2.75rem" }}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="register-email">
              Work email
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none z-10" />
              <Input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                style={{ paddingLeft: "2.75rem" }}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="register-message">
              Request details
            </label>
            <div className="relative flex items-start">
              <MessageSquare className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none z-10" />
              <textarea
                id="register-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Specify your role, team/department, and required module privileges."
                className="min-h-[92px] w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                style={{ paddingLeft: "2.75rem", paddingTop: "0.75rem" }}
                required
              />
            </div>
          </div>

          {feedback ? (
            <div
              className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs font-semibold leading-relaxed ${
                state === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {state === "success" && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />}
              <span>{feedback}</span>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={state === "submitting"}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]"
          >
            {state === "submitting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting request...
              </>
            ) : (
              <>
                Request access
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link
            href={withPublicAudience("/login", audience)}
            className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

