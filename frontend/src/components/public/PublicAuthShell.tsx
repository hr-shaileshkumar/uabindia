"use client";

import { type ReactNode } from "react";
import { Check, ShieldCheck } from "lucide-react";
import type { PublicAudience } from "@/lib/public-audience";
import PublicProductPreview from "@/components/public/PublicProductPreview";
import PublicHeader from "@/components/public/PublicHeader";
import { getBaseClientProfile, type ClientProfile } from "@/lib/publicProfile";
import { getDefaultHeaderContent, type PublicHeaderContent } from "@/lib/publicSiteContent";

export type PublicAuthShellVariant = "login" | "register" | "reset-password" | "forgot-password";

type PanelCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  points: string[];
};

const defaultPanelCopy: Record<PublicAuthShellVariant, PanelCopy> = {
  login: {
    eyebrow: "PLATFORM CONSOLE",
    title: "One login for tenants and platform control",
    subtitle: "Manage organizations, users, and configuration securely.",
    points: ["Tenant management", "User provisioning", "Platform audit"],
  },
  register: {
    eyebrow: "ACCESS REQUEST",
    title: "Request workspace access",
    subtitle: "An administrator reviews every request before credentials are issued.",
    points: ["Admin approval", "Role-aware provisioning", "Secure onboarding"],
  },
  "forgot-password": {
    eyebrow: "PASSWORD RECOVERY",
    title: "Reset your account password",
    subtitle: "Verify your email identity to safely receive reset instructions.",
    points: ["Verified work email", "Secure reset link", "Expires in 15 minutes"],
  },
  "reset-password": {
    eyebrow: "NEW PASSWORD",
    title: "Choose a strong password",
    subtitle: "Use at least 8 characters unique to this account.",
    points: ["Minimum 8 characters", "Unique password", "Email token required"],
  },
};

type PublicAuthShellProps = {
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
  brandName = "uabindia",
  homeHref = "/",
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
    <div className="relative flex min-h-[100dvh] flex-1 flex-col bg-[#f8fafc]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,rgba(37,99,235,0.08),transparent_55%),radial-gradient(ellipse_50%_40%_at_100%_0%,rgba(15,23,42,0.04),transparent_50%)]"
      />

      {/* Full Enterprise Header Navigation */}
      <PublicHeader
        audience={audience}
        profile={effectiveProfile}
        headerContent={effectiveHeaderContent}
        allowedPaths={allowedPaths}
      />

      {/* Main Form Content */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:py-12 lg:py-16">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Left Column / Marketing & Feature Card */}
          <aside className="hidden lg:flex lg:flex-col lg:justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {panel.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {panel.title}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-slate-600">{panel.subtitle}</p>

            <ul className="mt-5 space-y-2.5">
              {panel.points.map((point) => (
                <li key={point} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            {/* Clean Abstract Dashboard Preview Card */}
            <div className="mt-8 max-w-md">
              <PublicProductPreview compact className="shadow-lg" />
            </div>

            {/* Bottom Security Footer */}
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
              <span>Encrypted sessions · Role-based access · Audit-ready</span>
            </div>
          </aside>

          {/* Right Column / Auth Form Card */}
          <div className="mx-auto w-full max-w-[420px] lg:mx-0 lg:max-w-none">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
