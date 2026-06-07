"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Clock3, Mail, Phone } from "lucide-react";
import PublicPageIntro from "@/components/public/PublicPageIntro";
import PublicSiteFrame from "@/components/public/PublicSiteFrame";
import { publicMutedPanelClassName, publicPanelClassName, publicSectionClassName } from "@/components/public/publicStyles";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { getRawMarkupContent } from "@/lib/publicSiteContent";
import { publicApi } from "@/services/publicApi";

type ContactContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  submitLabel: string;
  successMessage: string;
  sideTitle: string;
  supportAreasTitle: string;
};

export default function ContactPage() {
  const { profile, pageRecord, headerContent, footerContent, parseContent } = usePublicPageData("contact");
  const normalizedCompanyName = profile.companyName?.trim().toLowerCase() ?? "";
  const invalidCompanyName =
    !normalizedCompanyName ||
    ["client company name", "erp", "portal", "tenant", "company", "www", "app"].includes(normalizedCompanyName);
  const normalizedBrandName = profile.brandName?.trim().toLowerCase() ?? "";
  const resolvedBrandName =
    normalizedBrandName &&
    !["erp", "portal", "tenant", "client", "company", "www", "app"].includes(normalizedBrandName)
      ? profile.brandName
      : "Uabindia ERP";
  const formCompanyName = invalidCompanyName ? "" : profile.companyName;
  const contactTitleName = invalidCompanyName ? resolvedBrandName : profile.companyName;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    companyName: formCompanyName,
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const content = parseContent<ContactContent>({
    eyebrow: "Contact",
    title: `Reach the ${contactTitleName} support team`,
    subtitle: "Use this page for onboarding, payroll support, finance workflows, or tenant configuration requests.",
    submitLabel: "Send request",
    successMessage: "Your request has been received and routed to the support desk.",
    sideTitle: "Support desk",
    supportAreasTitle: "What we handle",
  });
  const rawMarkup = getRawMarkupContent(pageRecord?.contentJson);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      companyName: prev.companyName.trim().length > 0 ? prev.companyName : profile.companyName,
    }));
  }, [profile.companyName]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMessage(null);

    try {
      await publicApi.submitContact({
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber || undefined,
        companyName: formData.companyName || undefined,
        subject: formData.subject || undefined,
        message: formData.message,
      });
      setStatus("success");
      setFormData((prev) => ({
        ...prev,
        name: "",
        email: "",
        phoneNumber: "",
        subject: "",
        message: "",
      }));
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Unable to send your request right now.";
      setStatus("error");
      setErrorMessage(message);
    }
  };

  return (
    <PublicSiteFrame profile={profile} headerContent={headerContent} footerContent={footerContent}>
      <section className="py-18 sm:py-22">
        <div className={`${publicSectionClassName} grid gap-8 lg:grid-cols-[1fr_0.95fr]`}>
          <div className="space-y-7">
            <PublicPageIntro eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
          </div>

          <div className={`${publicMutedPanelClassName} p-7`}>
            <h2 className="text-lg font-semibold text-slate-950">{content.sideTitle}</h2>
            <div className="mt-5 grid gap-4">
              <div className="flex items-center gap-3 rounded-[1.2rem] border border-slate-200 bg-white p-4 text-sm text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{profile.supportEmail}</span>
              </div>
              <div className="flex items-center gap-3 rounded-[1.2rem] border border-slate-200 bg-white p-4 text-sm text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{profile.supportPhone}</span>
              </div>
              <div className="flex items-center gap-3 rounded-[1.2rem] border border-slate-200 bg-white p-4 text-sm text-slate-600">
                <Clock3 className="h-4 w-4 text-slate-400" />
                <span>{profile.supportHours}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-18 sm:pb-22">
        <div className={`${publicSectionClassName}`}>
          <div className={`${publicPanelClassName} p-8 lg:p-10`}>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">Submit a request</h2>
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Full name
                  <input
                    className="mt-2 w-full rounded-[1.15rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-(--erp-primary) focus:outline-none focus:ring-2 focus:ring-(--erp-ring)"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(event) => handleChange("name", event.target.value)}
                    required
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-900">
                  Work email
                  <input
                    className="mt-2 w-full rounded-[1.15rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-(--erp-primary) focus:outline-none focus:ring-2 focus:ring-(--erp-ring)"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-900">
                  Phone
                  <input
                    className="mt-2 w-full rounded-[1.15rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-(--erp-primary) focus:outline-none focus:ring-2 focus:ring-(--erp-ring)"
                    placeholder="+91 00 0000 0000"
                    value={formData.phoneNumber}
                    onChange={(event) => handleChange("phoneNumber", event.target.value)}
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-900">
                  Company
                  <input
                    className="mt-2 w-full rounded-[1.15rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-(--erp-primary) focus:outline-none focus:ring-2 focus:ring-(--erp-ring)"
                    placeholder="Company name"
                    value={formData.companyName}
                    onChange={(event) => handleChange("companyName", event.target.value)}
                  />
                </label>
              </div>

              <label className="block text-sm font-semibold text-slate-900">
                Subject
                <input
                  className="mt-2 w-full rounded-[1.15rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-(--erp-primary) focus:outline-none focus:ring-2 focus:ring-(--erp-ring)"
                  placeholder="Onboarding, payroll, finance, workflow change"
                  value={formData.subject}
                  onChange={(event) => handleChange("subject", event.target.value)}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-900">
                Message
                <textarea
                  className="mt-2 min-h-36 w-full rounded-[1.15rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-(--erp-primary) focus:outline-none focus:ring-2 focus:ring-(--erp-ring)"
                  placeholder="Describe what you need."
                  value={formData.message}
                  onChange={(event) => handleChange("message", event.target.value)}
                  required
                />
              </label>

              {status === "success" ? (
                <p className="rounded-[1.15rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {content.successMessage}
                </p>
              ) : null}
              {status === "error" ? (
                <p className="rounded-[1.15rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </p>
              ) : null}

              <button
                className="inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#0b4f8c,#0f6fa8)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(11,79,140,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                type="submit"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "Sending..." : content.submitLabel}
              </button>
            </form>
          </div>
        </div>
      </section>

      {rawMarkup ? (
        <section className="py-12">
          <div className={publicSectionClassName}>
            <div className={`prose max-w-none p-8 ${publicPanelClassName}`}>
              <div dangerouslySetInnerHTML={{ __html: rawMarkup }} />
            </div>
          </div>
        </section>
      ) : null}
    </PublicSiteFrame>
  );
}
