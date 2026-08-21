"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Loader2, Mail, MessageSquare, User } from "lucide-react";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicAuthAlert from "@/components/public/PublicAuthAlert";
import PublicAuthCard, { PublicAuthFooterLink } from "@/components/public/PublicAuthCard";
import { PublicAuthFormField, PublicAuthInput } from "@/components/public/PublicAuthFormField";
import PublicAuthShell from "@/components/public/PublicAuthShell";
import {
  publicButtonClassName,
  publicFormTextareaClassName,
} from "@/components/public/publicStyles";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { useResolvedPublicAudience } from "@/hooks/useResolvedPublicAudience";
import { getApiErrorMessage } from "@/lib/api-errors";
import { withPublicAudience, type PublicAudience } from "@/lib/public-audience";
import { cn } from "@/lib/utils";
import { publicApi } from "@/services/modules";
import { getTenantSubdomain } from "@/services/apiClient";

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
        variant="register"
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
        "request-access",
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
    <PublicAuthCard
      title="Request access"
      subtitle="Submit your details. An administrator will review and provision your workspace account."
      footer={
        <>
          Already have an account?{" "}
          <PublicAuthFooterLink href={withPublicAudience("/login", audience)}>Sign in</PublicAuthFooterLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <PublicAuthFormField id="register-name" label="Full name">
          <PublicAuthInput
            id="register-name"
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Your full name"
            icon={<User className="h-4 w-4" />}
            required
          />
        </PublicAuthFormField>

        <PublicAuthFormField id="register-email" label="Work email">
          <PublicAuthInput
            id="register-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            icon={<Mail className="h-4 w-4" />}
            required
          />
        </PublicAuthFormField>

        <PublicAuthFormField id="register-message" label="Request details">
          <div className="relative">
            <MessageSquare className="pointer-events-none absolute left-3.5 top-3.5 z-10 h-4 w-4 text-slate-400" />
            <textarea
              id="register-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Role, department, and modules you need access to."
              className={cn(publicFormTextareaClassName, "min-h-[108px] pl-10 pt-3 shadow-sm")}
              required
            />
          </div>
        </PublicAuthFormField>

        {feedback ? (
          <PublicAuthAlert tone={state === "error" ? "error" : "success"}>{feedback}</PublicAuthAlert>
        ) : null}

        <button type="submit" disabled={state === "submitting"} className={cn(publicButtonClassName.primary, "w-full")}>
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
    </PublicAuthCard>
  );
}
