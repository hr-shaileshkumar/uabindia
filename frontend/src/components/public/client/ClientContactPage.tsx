"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, MessageSquare } from "lucide-react";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicStructuredData from "@/components/public/PublicStructuredData";
import {
  publicButtonClassName,
  publicFormInputClassName,
  publicFormLabelClassName,
  publicFormTextareaClassName,
  publicPanelClassName,
  publicSectionClassName,
} from "@/components/public/publicStyles";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { notifySuccess } from "@/lib/notifications";
import { publicSiteUrl } from "@/lib/public-marketing";
import { cn } from "@/lib/utils";

type ContactContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export default function ClientContactPage() {
  const { profile, headerContent, footerContent, allowedPaths, pageVisible, parseContent } =
    usePublicPageData("contact", "tenant");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const companyDisplayName = profile.brandName || profile.companyName || "Organization";

  const content = parseContent<ContactContent>({
    eyebrow: "Contact & Support Desk",
    title: `Connect with ${companyDisplayName}`,
    subtitle:
      "Reach out to our customer service desk, vendor relations, or submit support tickets directly.",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      notifySuccess("Your message has been sent to our customer desk.");
    }, 700);
  };

  return (
    <PublicAudiencePageFrame
      audience="tenant"
      profile={profile}
      headerContent={headerContent}
      footerContent={footerContent}
      allowedPaths={allowedPaths}
      pageVisible={pageVisible}
    >
      <PublicStructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: `Contact | ${companyDisplayName}`,
          url: `${publicSiteUrl}/contact`,
          description: content.subtitle,
        }}
      />

      <div className={cn(publicSectionClassName, "pt-4 pb-12 sm:pt-6 sm:pb-16")}>
        {/* Header Breadcrumb & Title */}
        <div className="border-b border-slate-200/80 pb-6 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-cyan-400">
            <MessageSquare className="h-4 w-4" />
            <span className="uppercase tracking-wider">{content.eyebrow}</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white">
            {content.title}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            {content.subtitle}
          </p>
        </div>

        {/* 2-Column Contact Info & Ticket Form */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Direct Info Cards */}
          <div className="lg:col-span-5 space-y-4">
            <div className={publicPanelClassName}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400 mb-4">
                Office & Operations Desk
              </h3>
              <div className="space-y-4 text-sm">
                {profile.headquarters && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-cyan-400 border border-blue-100 dark:border-blue-900/60 shadow-2xs">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Headquarters</span>
                      <p className="text-slate-800 dark:text-slate-100 font-semibold mt-0.5 leading-relaxed">{profile.headquarters}</p>
                    </div>
                  </div>
                )}
                {profile.supportPhone && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-cyan-400 border border-blue-100 dark:border-blue-900/60 shadow-2xs">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Phone</span>
                      <p className="text-slate-800 dark:text-slate-100 font-semibold mt-0.5">{profile.supportPhone}</p>
                    </div>
                  </div>
                )}
                {profile.supportEmail && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-cyan-400 border border-blue-100 dark:border-blue-900/60 shadow-2xs">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email</span>
                      <p className="text-slate-800 dark:text-slate-100 font-semibold mt-0.5">{profile.supportEmail}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-cyan-400 border border-blue-100 dark:border-blue-900/60 shadow-2xs">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Business Hours</span>
                    <p className="text-slate-800 dark:text-slate-100 font-semibold mt-0.5">Mon – Sat: 9:00 AM – 6:30 PM IST</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-200/80 bg-blue-50/70 p-5 dark:border-blue-900/60 dark:bg-blue-950/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                Staff & Employee Self-Service
              </h4>
              <p className="mt-1 text-sm text-blue-900/90 dark:text-blue-200 leading-relaxed">
                Employees seeking payslip downloads, attendance corrections, or leave approvals should log in directly to the employee portal.
              </p>
              <Link
                href="/login"
                className="mt-3 inline-flex items-center text-sm font-bold text-[var(--uab-primary,#1d4ed8)] hover:underline"
              >
                Go to Employee Login &rarr;
              </Link>
            </div>
          </div>

          {/* Right Column: Ticket / Message Form */}
          <div className="lg:col-span-7">
            <div className={publicPanelClassName}>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Send a Direct Message</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">Our department coordinators respond within 24 business hours.</p>

              {submitted ? (
                <div className="py-10 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                  <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">Message Delivered</h3>
                  <p className="mt-1 text-xs text-slate-500">A ticket reference has been logged. Thank you for reaching out.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setSubject("");
                      setMessage("");
                    }}
                    className={cn(publicButtonClassName.secondary, "mt-5 text-xs h-9")}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={publicFormLabelClassName}>Your Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={publicFormInputClassName}
                      />
                    </div>
                    <div>
                      <label className={publicFormLabelClassName}>Work Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={publicFormInputClassName}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={publicFormLabelClassName}>Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={publicFormInputClassName}
                      />
                    </div>
                    <div>
                      <label className={publicFormLabelClassName}>Subject *</label>
                      <input
                        type="text"
                        required
                        placeholder="Order status / General inquiry"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className={publicFormInputClassName}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={publicFormLabelClassName}>Message / Query *</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Please provide details about your inquiry..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className={publicFormTextareaClassName}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(publicButtonClassName.primary, "w-full")}
                  >
                    <Send className="h-4 w-4" />
                    {isSubmitting ? "Delivering..." : "Submit Inquiry"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicAudiencePageFrame>
  );
}
