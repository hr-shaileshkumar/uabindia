"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { publicApi } from "@/lib/publicApi";
import {
  buildClientProfile,
  getBaseClientProfile,
  type ClientProfile,
} from "@/lib/publicProfile";

export default function Home() {
  const [profile, setProfile] = useState<ClientProfile>(getBaseClientProfile());

  useEffect(() => {
    let isActive = true;
    publicApi
      .getCompanyProfile()
      .then((response) => {
        if (!isActive) return;
        setProfile(buildClientProfile(response.data));
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f4ef] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-[#f6f4ef]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <img
              src={profile.logoUrl || "/logo.png"}
              alt={profile.brandName}
              width={120}
              height={36}
              className="h-8 w-auto"
            />
            <div className="hidden md:block text-xs font-semibold tracking-[0.2em] text-slate-500">
              ENTERPRISE ERP
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <Link href="/about" className="hover:text-slate-900">About</Link>
            <Link href="/careers" className="hover:text-slate-900">Careers</Link>
            <Link href="/contact" className="hover:text-slate-900">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-amber-200/70 blur-3xl" />
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-teal-200/60 blur-3xl" />

          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#f6f4ef]">
                Client ERP Portal
              </div>
              <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                {profile.heroTitle}
              </h1>
              <p className="text-base text-slate-700 md:text-lg">{profile.heroSubtitle}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="rounded-full bg-teal-700 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  Launch ERP
                </Link>
                <Link
                  href="/contact"
                  className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 hover:bg-white"
                >
                  Request a Demo
                </Link>
              </div>
              <div className="flex flex-wrap gap-6 text-xs text-slate-600">
                <span>{profile.companyName}</span>
                <span>{profile.industry}</span>
                <span>Secure by design</span>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Live Snapshot</span>
                  <span className="text-xs text-slate-500">Today</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {profile.snapshot.map((item) => (
                    <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">{item.label}</p>
                      <p className="text-lg font-semibold text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-slate-100 bg-[#f8fbf9] p-4">
                  <p className="text-xs font-semibold text-slate-500">Client Workflow</p>
                  <p className="text-sm text-slate-700">{profile.workflowNote}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12">
          <div className="grid gap-6 md:grid-cols-3">
            {profile.highlights.map((item) => (
              <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16">
          <div className="rounded-3xl border border-slate-200 bg-slate-900 px-8 py-10 text-[#f6f4ef] md:flex md:items-center md:justify-between">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold">Ready for your ERP launch?</h2>
              <p className="text-sm text-slate-300">Client teams can log in to manage modules, people, and operations.</p>
            </div>
            <div className="mt-6 flex gap-3 md:mt-0">
              <Link
                href="/login"
                className="rounded-full bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-teal-400"
              >
                Go to Login
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-slate-500 px-6 py-3 text-sm font-semibold text-slate-100 hover:border-slate-300"
              >
                Talk to Us
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/70 bg-[#f6f4ef]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">UabIndia ERP</p>
            <p className="text-sm text-slate-600">
              A full-stack ERP platform delivering HRMS, payroll, finance, and inventory with real-time visibility.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-slate-600">
            <Link href="/about" className="hover:text-slate-900">About</Link>
            <Link href="/careers" className="hover:text-slate-900">Careers</Link>
            <Link href="/contact" className="hover:text-slate-900">Contact</Link>
            <Link href="/login" className="hover:text-slate-900">Login</Link>
          </div>
        </div>
        <div className="border-t border-slate-200/70 py-4 text-center text-xs text-slate-500">
          © 2026 UabIndia ERP. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
