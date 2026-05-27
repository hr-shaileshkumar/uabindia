"use client";

import { useEffect, useState, type FormEvent } from "react";
import PublicPageIntro from "@/components/public/PublicPageIntro";
import PublicSiteFrame from "@/components/public/PublicSiteFrame";
import { publicPanelClassName } from "@/components/public/publicStyles";
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

const supportAreas = [
  "ERP access",
  "Payroll",
  "HR operations",
  "Finance workflows",
  "Tenant changes",
];

export default function ContactPage() {
  const { profile, pageRecord, headerContent, footerContent, parseContent } = usePublicPageData("contact");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    companyName: profile.companyName,
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const content = parseContent<ContactContent>({
    eyebrow: "Contact",
    title: `Reach the ${profile.companyName} ERP support team`,
    subtitle:
      "Submit your request for onboarding, payroll support, finance workflows, or platform configuration and receive a clear next step within one business day.",
    submitLabel: "Send Request",
    successMessage: "Your request has been received and is being routed to our support desk.",
    sideTitle: "Support desk",
    supportAreasTitle: "Areas we support",
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
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <PublicPageIntro eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Response time</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">Within 24 hrs</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Coverage</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">ERP + HR</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Trusted by</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">Enterprise teams</p>
              </div>
            </div>
          </div>

          <div className={`${publicPanelClassName} p-8`}>
            <h2 className="text-lg font-semibold text-slate-900">Platform support</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              A dedicated team for secure ERP, finance, payroll, and HR workflows across regulated enterprises.
            </p>
            <div className="mt-8 grid gap-4">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{profile.supportEmail}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Phone</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{profile.supportPhone}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Hours</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{profile.supportHours}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className={`${publicPanelClassName} p-8`}>
            <h2 className="text-lg font-semibold text-slate-900">Submit a request</h2>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Full Name
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-(--erp-primary) focus:outline-none focus:ring-2 focus:ring-(--erp-ring)"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(event) => handleChange("name", event.target.value)}
                    required
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Work Email
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-(--erp-primary) focus:outline-none focus:ring-2 focus:ring-(--erp-ring)"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={(event) => handleChange("email", event.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Phone
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-(--erp-primary) focus:outline-none focus:ring-2 focus:ring-(--erp-ring)"
                    placeholder="+91 00 0000 0000"
                    value={formData.phoneNumber}
                    onChange={(event) => handleChange("phoneNumber", event.target.value)}
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Company
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-(--erp-primary) focus:outline-none focus:ring-2 focus:ring-(--erp-ring)"
                    placeholder="Company name"
                    value={formData.companyName}
                    onChange={(event) => handleChange("companyName", event.target.value)}
                  />
                </label>
              </div>

              <label className="block text-sm font-semibold text-slate-700">
                Subject
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-(--erp-primary) focus:outline-none focus:ring-2 focus:ring-(--erp-ring)"
                  placeholder="Support, onboarding, payroll, ERP workflow"
                  value={formData.subject}
                  onChange={(event) => handleChange("subject", event.target.value)}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                What do you need?
                <textarea
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-(--erp-primary) focus:outline-none focus:ring-2 focus:ring-(--erp-ring)"
                  rows={4}
                  placeholder="Tell us about your ERP or SaaS requirement"
                  value={formData.message}
                  onChange={(event) => handleChange("message", event.target.value)}
                  required
                />
              </label>

              {status === "success" && (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {content.successMessage}
                </p>
              )}
              {status === "error" && (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </p>
              )}

              <button
                className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-(--erp-primary) px-6 py-3 text-sm font-semibold text-white hover:bg-(--erp-primary-hover) disabled:cursor-not-allowed disabled:opacity-70"
                type="submit"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "Sending..." : content.submitLabel}
              </button>
            </form>
          </div>

          <aside className={`${publicPanelClassName} p-8`}>
            <h2 className="text-lg font-semibold text-slate-900">{content.sideTitle}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Get help from our dedicated team for tenant onboarding, payroll, finance, and HR workflows.
            </p>
            <div className="mt-8 space-y-4 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">Email</p>
                <p>{profile.supportEmail}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Phone</p>
                <p>{profile.supportPhone}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Hours</p>
                <p>{profile.supportHours}</p>
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-slate-900">{content.supportAreasTitle}</h3>
              <div className="mt-3 grid gap-2">
                {supportAreas.map((item) => (
                  <span
                    key={item}
                    className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {rawMarkup && (
          <div className={`prose mt-10 max-w-none p-8 ${publicPanelClassName}`}>
            <div dangerouslySetInnerHTML={{ __html: rawMarkup }} />
          </div>
        )}
      </section>
    </PublicSiteFrame>
  );
}
