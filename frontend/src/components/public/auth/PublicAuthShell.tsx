"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import type { PublicAudience } from "@/lib/public-audience";
import PublicProductPreview from "@/components/public/PublicProductPreview";
import PublicHeader from "@/components/public/PublicHeader";
import { getBaseClientProfile, type ClientProfile } from "@/lib/publicProfile";
import { getDefaultHeaderContent, type PublicHeaderContent } from "@/lib/publicSiteContent";
import { publicSectionClassName } from "@/components/public/publicStyles";
import { cn } from "@/lib/utils";

export type PublicAuthShellVariant = "login" | "register" | "reset-password" | "forgot-password";

type PanelCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  points: string[];
};

const defaultPanelCopy: Record<PublicAuthShellVariant, PanelCopy> = {
  login: {
    eyebrow: "UAB INDIA ENTERPRISE CONSOLE",
    title: "Unified workspace access for tenants and administrators",
    subtitle: "Manage your workforce, ledger accounting, and operations securely.",
    points: ["Multi-tenant isolation & data sovereignty", "Role-based authorization & audit trails", "End-to-end TLS 1.3 encrypted sessions"],
  },
  register: {
    eyebrow: "ORGANIZATION PROVISIONING",
    title: "Create your dedicated enterprise tenant",
    subtitle: "Deploy a high-availability isolated workspace in seconds.",
    points: ["Automated database tenant schema generation", "Preset chart of accounts & statutory tax rules", "Enterprise support & guided onboarding"],
  },
  "forgot-password": {
    eyebrow: "SECURITY VERIFICATION",
    title: "Reset your workspace credentials",
    subtitle: "Verify your registered enterprise email to receive secure instructions.",
    points: ["Verified work email required", "One-time cryptographically signed token", "15-minute expiration window"],
  },
  "reset-password": {
    eyebrow: "CREDENTIAL PROTECTION",
    title: "Define a secure new password",
    subtitle: "Ensure your new credentials conform to corporate security policies.",
    points: ["Minimum 8 characters with complexity checks", "Enforced password history check", "Terminates existing sessions upon update"],
  },
};

export type PublicAuthShellProps = {
  children: ReactNode;
  brandName?: string;
  homeHref?: string;
  audience?: PublicAudience;
  variant?: PublicAuthShellVariant;
  profile?: ClientProfile;
  headerContent?: PublicHeaderContent;
  allowedPaths?: string[];
};

export default function PublicAuthShell({
  children,
  brandName = "UabIndia ERP",
  audience = "tenant",
  variant = "login",
  profile,
  headerContent,
  allowedPaths,
}: PublicAuthShellProps) {
  const panel = defaultPanelCopy[variant] || defaultPanelCopy.login;

  const effectiveProfile: ClientProfile = profile || {
    ...getBaseClientProfile(),
    brandName,
  };

  const effectiveHeaderContent: PublicHeaderContent =
    headerContent || getDefaultHeaderContent(effectiveProfile, audience);

  return (
    <div className="relative flex min-h-[100dvh] flex-1 flex-col bg-[#f8fafc] dark:bg-slate-950 transition-colors">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,rgba(37,99,235,0.09),transparent_55%),radial-gradient(ellipse_50%_40%_at_100%_0%,rgba(15,23,42,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,rgba(37,99,235,0.15),transparent_55%),radial-gradient(ellipse_50%_40%_at_100%_0%,rgba(6,182,212,0.08),transparent_50%)]"
      />

      {/* Full Enterprise Header Navigation */}
      <PublicHeader
        audience={audience}
        profile={effectiveProfile}
        headerContent={effectiveHeaderContent}
        allowedPaths={allowedPaths}
      />

      {/* Main Form Content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-start pt-3 pb-6 sm:pt-4 sm:pb-8 lg:pt-6 lg:pb-10">
        <div className={cn(publicSectionClassName, "grid items-start gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-8 xl:gap-12")}>
          {/* Left Column / Marketing & Feature Card */}
          <aside className="hidden lg:flex lg:flex-col lg:justify-center">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-cyan-400">
              {panel.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.16] dark:text-white">
              {panel.title}
            </h1>
            <p className="mt-3.5 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
              {panel.subtitle}
            </p>

            <ul className="mt-6 space-y-3">
              {panel.points.map((point) => (
                <li key={point} className="flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            {/* Clean Abstract Dashboard Preview Card */}
            <div className="mt-8 max-w-lg">
              <PublicProductPreview compact className="shadow-lg shadow-slate-900/5 dark:shadow-blue-950/20" />
            </div>

            {/* Bottom Security Footer */}
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              <span>Encrypted sessions · ISO-standard access · Audit-ready</span>
            </div>
          </aside>

          {/* Right Column / Auth Form Card */}
          <div className="mx-auto w-full max-w-[460px] lg:mx-0 lg:max-w-none">
            {children}
          </div>
        </div>
      </main>

      {/* Dedicated Enterprise Public Auth Footer */}
      <footer className="relative z-10 border-t border-slate-200/80 bg-white/70 backdrop-blur-xs py-3.5 text-xs text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/70 dark:text-slate-400">
        <div className={cn(publicSectionClassName, "flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left")}>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11.5px]">
            <span className="font-semibold text-slate-700 dark:text-slate-300">UabIndia ERP Enterprise</span>
            <span>•</span>
            <span>Multi-Region Cloud Tier-IV</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              All Systems Operational
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-[11.5px]">
            <Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</Link>
            <Link href="/helpdesk" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Support</Link>
            <span>&copy; {new Date().getFullYear()} UabIndia Corp.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
