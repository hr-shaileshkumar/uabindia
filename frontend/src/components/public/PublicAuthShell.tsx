"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck, BarChart3, Users, TrendingUp, ArrowLeft } from "lucide-react";
import type { PublicAudience } from "@/lib/public-audience";

const enterpriseFeatures = [
  { icon: Users, text: "HR, Payroll & Attendance unified", desc: "Automated timesheets & salary processing" },
  { icon: BarChart3, text: "Finance, Inventory & Procurement", desc: "Real-time cost tracking & audit trails" },
  { icon: ShieldCheck, text: "Role-based access & audit logs", desc: "Enterprise governance & access controls" },
  { icon: TrendingUp, text: "Real-time dashboards & analytics", desc: "Instant operational visibility" },
];

type PublicAuthShellProps = {
  children: ReactNode;
  brandName?: string;
  homeHref?: string;
  audience?: PublicAudience;
};

export default function PublicAuthShell({
  children,
  brandName = "UabIndia ERP",
  homeHref = "/",
  audience = "tenant",
}: PublicAuthShellProps) {
  return (
    <div className="flex min-h-screen w-full bg-slate-900">
      {/* ── Left Hero Panel (Desktop Only >= 1024px) ────────────────── */}
      <div className="relative hidden lg:flex lg:w-[44%] lg:min-w-[360px] lg:flex-col lg:justify-between p-10 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shrink-0 border-r border-slate-800/60">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute -top-20 -left-20 h-[320px] w-[320px] rounded-full bg-blue-600/20 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-[300px] w-[300px] rounded-full bg-teal-500/15 blur-[100px]" />

        {/* Subtle background dot grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, #93c5fd 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Content Container */}
        <div className="relative z-10 flex flex-col justify-between h-full space-y-8">
          {/* Top Bar: Brand Logo + Back Link */}
          <div className="flex items-center justify-between">
            <Link href={homeHref} className="inline-flex items-center gap-2.5 group">
              <img
                src="/logo.png"
                alt={brandName}
                className="h-7 w-auto object-contain brightness-0 invert opacity-90 transition-opacity group-hover:opacity-100"
              />
            </Link>
            <Link
              href={homeHref}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to site
            </Link>
          </div>

          {/* Hero Content Section */}
          <div className="my-auto space-y-7 py-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 mb-4">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-[0.62rem] font-extrabold uppercase tracking-[0.2em] text-blue-300">
                  {audience === "tenant" ? "Your Workspace" : "Platform Control"}
                </span>
              </div>
              <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {audience === "tenant" ? (
                  <>
                    Your business,{" "}
                    <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                      one platform.
                    </span>
                  </>
                ) : (
                  <>
                    Platform{" "}
                    <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                      control center.
                    </span>
                  </>
                )}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-400 max-w-md">
                {audience === "tenant"
                  ? "HR, payroll, attendance, finance, and workflows unified under one intelligent system."
                  : "Manage instances, workspace accounts, and global security from a single console."}
              </p>
            </div>

            {/* Feature Highlight Rows */}
            <div className="space-y-2.5">
              {enterpriseFeatures.map(({ icon: Icon, text, desc }) => (
                <div
                  key={text}
                  className="flex items-center gap-3.5 p-3 rounded-xl border border-white/5 bg-white/[0.03] backdrop-blur-sm transition-all hover:bg-white/[0.06] hover:border-white/10"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{text}</p>
                    <p className="text-[0.68rem] text-slate-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
            {[
              { value: "500+", label: "Clients" },
              { value: "12+", label: "Modules" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center py-2.5 px-2 rounded-xl border border-white/5 bg-white/[0.03]"
              >
                <p className="text-lg font-extrabold text-blue-400 leading-none">{stat.value}</p>
                <p className="mt-1 text-[0.6rem] font-bold tracking-widest uppercase text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Form Panel (Full width on Mobile, Flex 1 on Desktop) ── */}
      <div className="flex flex-1 flex-col min-w-0 bg-slate-50 min-h-screen">
        {/* Mobile Navbar Header (ONLY VISIBLE ON MOBILE <1024px) */}
        <div className="flex lg:hidden items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white shadow-sm">
          <Link href={homeHref} className="flex items-center">
            <img src="/logo.png" alt={brandName} className="h-5 w-auto object-contain" />
          </Link>
          <Link
            href={homeHref}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-[440px]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

