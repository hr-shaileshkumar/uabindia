"use client";

import type { ReactNode } from "react";
import type { ClientProfile } from "@/lib/publicProfile";
import { publicPanelClassName } from "@/components/public/publicStyles";

type LoginCardProps = {
  profile: ClientProfile;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function LoginCard({
  profile,
  title,
  subtitle,
  children,
  footer,
}: LoginCardProps) {
  const brandName = profile.brandName || profile.companyName || "Uabindia ERP";

  return (
    <div className={`${publicPanelClassName} mx-auto overflow-hidden p-6 sm:p-8`}>
      <div className="flex flex-col items-center text-center">
        <img
          src={profile.logoUrl || "/logo.png?v=uabindia-20260205"}
          alt={`${brandName} logo`}
          width={168}
          height={56}
          className="h-9 w-auto max-w-[8.75rem] object-contain"
        />
        <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{title}</h2>
        {subtitle ? <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{subtitle}</p> : null}
      </div>

      <div className="mt-8">{children}</div>

      {footer ? <div className="mt-6 border-t border-slate-200 pt-5">{footer}</div> : null}
    </div>
  );
}
