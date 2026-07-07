"use client";

import type { ReactNode } from "react";
import type { ClientProfile } from "@/lib/publicProfile";
import { publicPanelClassName } from "@/components/public/publicStyles";

type LoginCardProps = {
  profile: ClientProfile;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  children: ReactNode;
  footer?: ReactNode;
};

export default function LoginCard({
  profile,
  eyebrow,
  title,
  subtitle,
  align = "center",
  children,
  footer,
}: LoginCardProps) {
  const brandName = profile.brandName || profile.companyName || "Uabindia ERP";
  const isCentered = align === "center";

  return (
    <div className={`${publicPanelClassName} mx-auto overflow-hidden border-white/80 bg-white/96 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.1)] sm:p-8`}>
      <div className="mb-6 h-1.5 w-24 rounded-full bg-[linear-gradient(90deg,var(--public-brand-strong),var(--public-brand),var(--public-brand-soft))]" />
      <div className={`flex flex-col ${isCentered ? "items-center text-center" : "items-start text-left"}`}>
        <div className={`flex items-center gap-3 ${isCentered ? "justify-center" : ""}`}>
          <img
            src={profile.logoUrl || "/logo.png?v=uabindia-20260205"}
            alt={`${brandName} logo`}
            width={168}
            height={56}
            className="h-10 w-auto max-w-[10rem] object-contain"
          />
          {!isCentered ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm">
              Secure workspace
            </span>
          ) : null}
        </div>
        {eyebrow ? (
          <p className="mt-5 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[color:var(--erp-primary)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-3 text-[1.7rem] font-semibold tracking-[-0.05em] text-slate-950">{title}</h2>
        {subtitle ? <p className={`mt-3 text-sm leading-6 text-slate-500 ${isCentered ? "max-w-md" : "max-w-lg"}`}>{subtitle}</p> : null}
      </div>

      <div className="mt-8">{children}</div>

      {footer ? <div className="mt-7 border-t border-slate-200 pt-5 text-sm text-slate-600">{footer}</div> : null}
    </div>
  );
}
