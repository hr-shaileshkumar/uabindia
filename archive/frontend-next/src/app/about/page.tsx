"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { publicApi } from "@/lib/publicApi";
import {
  buildClientProfile,
  getBaseClientProfile,
  type ClientProfile,
} from "@/lib/publicProfile";

export default function AboutPage() {
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
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Client Company Profile</p>
          <h1 className="text-3xl font-semibold">{profile.companyName}</h1>
          <p className="text-base text-slate-700">{profile.overview}</p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Company Snapshot</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-800">Company:</span> {profile.companyName}</p>
              <p><span className="font-semibold text-slate-800">Industry:</span> {profile.industry}</p>
              <p><span className="font-semibold text-slate-800">Headquarters:</span> {profile.headquarters}</p>
              <p><span className="font-semibold text-slate-800">Employees:</span> {profile.employeeCount}</p>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Services in Use</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>{profile.servicesInUse.join(", ")}</p>
              <p>Support Tier: {profile.supportTier}</p>
              <p>Implementation Partner: {profile.implementationPartner}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">How teams use the ERP</h2>
          <p className="mt-2 text-sm text-slate-600">{profile.cultureNote}</p>
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
