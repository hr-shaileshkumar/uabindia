"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { publicApi } from "@/lib/publicApi";
import {
  buildClientProfile,
  getBaseClientProfile,
  type ClientProfile,
} from "@/lib/publicProfile";

export default function ContactPage() {
  const [profile, setProfile] = useState<ClientProfile>(getBaseClientProfile());
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    companyName: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    publicApi
      .getCompanyProfile()
      .then((response) => {
        if (!isActive) return;
        const updated = buildClientProfile(response.data);
        setProfile(updated);
        setFormData((prev) => ({
          ...prev,
          companyName: prev.companyName || updated.companyName,
        }));
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, []);

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
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to send your request right now.";
      setStatus("error");
      setErrorMessage(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f4ef] text-slate-900">
      <header className="border-b border-slate-200/70 bg-[#f6f4ef]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
            ← Back to Home
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
          >
            Login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-12">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Client Contact</p>
          <h1 className="text-3xl font-semibold">Connect with your ERP support team.</h1>
          <p className="text-base text-slate-700">
            Client companies can use this page to share requests, raise support tickets, and update company details.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-semibold text-slate-700">Full Name</label>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Work Email</label>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Phone</label>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                  placeholder="+91 00 0000 0000"
                  value={formData.phoneNumber}
                  onChange={(event) => handleChange("phoneNumber", event.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Company</label>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                  placeholder="Company name"
                  value={formData.companyName}
                  onChange={(event) => handleChange("companyName", event.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Subject</label>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                  placeholder="Support, onboarding, demo, etc."
                  value={formData.subject}
                  onChange={(event) => handleChange("subject", event.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">What do you need?</label>
                <textarea
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                  rows={4}
                  placeholder="Tell us about your ERP goals"
                  value={formData.message}
                  onChange={(event) => handleChange("message", event.target.value)}
                  required
                />
              </div>
              {status === "success" && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Request received. Our team will follow up shortly.
                </p>
              )}
              {status === "error" && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </p>
              )}
              <button
                className="w-full rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
                type="submit"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "Sending..." : "Send Request"}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Client Company Details</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>{profile.companyName}</p>
              <p>{profile.headquarters}</p>
              <p>{profile.supportPhone}</p>
              <p>{profile.supportEmail}</p>
              <p>Support Hours · {profile.supportHours}</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200/70 bg-[#f6f4ef]">
        <div className="mx-auto max-w-5xl px-5 py-6 text-xs text-slate-500">
          © 2026 UabIndia . All rights reserved.
        </div>
      </footer>
    </div>
  );
}
