"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { clientJobs } from "@/data/clientProfile";
import { publicApi, type PublicJobPosting } from "@/lib/publicApi";
import {
  buildClientProfile,
  getBaseClientProfile,
  type ClientProfile,
} from "@/lib/publicProfile";

type JobCard = {
  role: string;
  company: string;
  location: string;
  type: string;
};

const formatJobType = (jobType?: string) => {
  if (!jobType) return "Full-time";
  const spaced = jobType.replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.replace(/\s+/g, " ").trim();
};

export default function CareersPage() {
  const [profile, setProfile] = useState<ClientProfile>(getBaseClientProfile());
  const [jobs, setJobs] = useState<JobCard[]>(clientJobs);

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

  useEffect(() => {
    let isActive = true;
    publicApi
      .getActiveJobPostings()
      .then((response) => {
        if (!isActive) return;
        const postings = response.data.jobPostings || [];
        if (!postings.length) return;
        setJobs(mapJobPostings(postings, profile.companyName));
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [profile.companyName]);

  const headerText = useMemo(
    () => `Explore openings from ${profile.companyName}.`,
    [profile.companyName]
  );

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
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Client Careers</p>
          <h1 className="text-3xl font-semibold">{headerText}</h1>
          <p className="text-base text-slate-700">
            Client companies using UabIndia ERP share their job openings here. Roles highlight ERP-friendly skills
            for operations, finance, HR, and supply chain.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {jobs.map((item) => (
            <div key={item.role} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">{item.role}</h2>
              <p className="mt-1 text-sm text-slate-600">{item.company}</p>
              <p className="mt-2 text-xs text-slate-500">{item.location}</p>
              <p className="mt-2 text-xs text-slate-500">{item.type}</p>
              <Link
                href="/contact"
                className="mt-4 inline-flex text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                Apply →
              </Link>
            </div>
          ))}
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

const mapJobPostings = (postings: PublicJobPosting[], companyName: string): JobCard[] =>
  postings.map((job) => ({
    role: job.title,
    company: companyName,
    location: job.location || "Location not specified",
    type: formatJobType(job.jobType),
  }));
