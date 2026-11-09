"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { DynamicPage } from "@/components/dynamic/DynamicPage";

export default function CompaniesPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-4 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-500/20 p-2 text-blue-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold">New Company Guided Onboarding Wizard</h3>
            <p className="text-xs text-blue-200">
              Configure 7-tier territory, department trees, statutory ceilings, and auto-number prefixes in 6 guided steps.
            </p>
          </div>
        </div>
        <Link
          href="/administration/companies/setup-wizard"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-blue-950 shadow-xs hover:bg-blue-50 transition-colors"
        >
          Launch Setup Wizard <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <DynamicPage pageKey="administration.companies" />
    </div>
  );
}
