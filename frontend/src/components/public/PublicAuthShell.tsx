"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import type { PublicAudience } from "@/lib/public-audience";
import PublicProductPreview from "@/components/public/PublicProductPreview";
import { publicEyebrowClassName, publicSectionClassName } from "@/components/public/publicStyles";
import { cn } from "@/lib/utils";

export type PublicAuthShellVariant = "login" | "forgot-password" | "register" | "reset-password";

type PanelCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  points: string[];
};

const tenantPanelCopy: Record<PublicAuthShellVariant, PanelCopy> = {
  login: {
    eyebrow: "Cloud ERP",
    title: "One workspace for your whole business",
    subtitle: "Secure access to HR, payroll, finance, and operations.",
    points: ["Encrypted sessions", "Role-based access", "Audit-ready activity"],
  },
  "forgot-password": {
    eyebrow: "Account recovery",
    title: "Reset access securely",
    subtitle: "Reset links are sent only to your verified work email.",
    points: ["Email verification", "Expiring reset links", "Admin support available"],
  },
  register: {
    eyebrow: "Access request",
    title: "Request workspace access",
    subtitle: "An administrator reviews every request before credentials are issued.",
    points: ["Admin approval", "Role-aware provisioning", "Secure onboarding"],
  },
  "reset-password": {
    eyebrow: "New password",
    title: "Choose a strong password",
    subtitle: "Use at least 8 characters unique to this account.",
    points: ["Minimum 8 characters", "Unique password", "Email token required"],
  },
};

const platformPanelCopy: Record<PublicAuthShellVariant, PanelCopy> = {
  ...tenantPanelCopy,
  login: {
    eyebrow: "Platform console",
    title: "One login for tenants and platform control",
    subtitle: "Manage organizations, users, and configuration securely.",
    points: ["Tenant management", "User provisioning", "Platform audit"],
  },
  register: {
    eyebrow: "Platform access",
    title: "Request operator access",
    subtitle: "Access is granted after review by the platform team.",
    points: ["Reviewed before issue", "Scoped operator roles", "Secure onboarding"],
  },
};

type PublicAuthShellProps = {
  children: ReactNode;
  brandName?: string;
  homeHref?: string;
  audience?: PublicAudience;
  variant?: PublicAuthShellVariant;
};

export default function PublicAuthShell({
  children,
  brandName = "UabIndia ERP",
  homeHref = "/",
  audience = "tenant",
  variant = "login",
}: PublicAuthShellProps) {
  const panel = audience === "platform" ? platformPanelCopy[variant] : tenantPanelCopy[variant];

  return (
    <div className="relative flex min-h-[100dvh] flex-1 flex-col bg-[#f8fafc]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,rgba(37,99,235,0.10),transparent_55%),radial-gradient(ellipse_50%_40%_at_100%_0%,rgba(15,23,42,0.05),transparent_50%)]"
      />

      <header className="relative z-20 shrink-0 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className={cn(publicSectionClassName, "flex h-14 items-center justify-between")}>
          <Link href={homeHref} className="inline-flex items-center">
            <img src="/logo.png" alt={brandName} className="h-6 w-auto object-contain" />
          </Link>
          <Link
            href={homeHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to site
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col">
        <div
          className={cn(
            publicSectionClassName,
            "flex flex-1 flex-col justify-center gap-8 py-8 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-10",
          )}
        >
          <aside className="hidden lg:block">
            <p className={publicEyebrowClassName}>{panel.eyebrow}</p>
            <h1 className="mt-3 max-w-md text-[1.75rem] font-semibold leading-tight tracking-tight text-slate-900 xl:text-[1.9rem]">
              {panel.title}
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">{panel.subtitle}</p>
            <ul className="mt-5 space-y-2">
              {panel.points.map((point) => (
                <li key={point} className="flex items-center gap-2 text-sm text-slate-700">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  {point}
                </li>
              ))}
            </ul>
            <div className="relative mt-6 max-w-md">
              <PublicProductPreview compact className="relative" />
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              Encrypted sessions · Role-based access · Audit-ready
            </p>
          </aside>

          <div className="mx-auto w-full max-w-[400px] lg:mx-0 lg:justify-self-end xl:max-w-[420px]">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
