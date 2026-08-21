"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { publicAuthLinkClassName, publicEyebrowClassName } from "@/components/public/publicStyles";
import { cn } from "@/lib/utils";

type PublicAuthCardProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export default function PublicAuthCard({
  title,
  subtitle,
  eyebrow,
  children,
  footer,
  className,
}: PublicAuthCardProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.18)] sm:p-7">
        {eyebrow ? <p className={cn(publicEyebrowClassName, "mb-3")}>{eyebrow}</p> : null}
        <h1 className="text-[1.35rem] font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{subtitle}</p>
        <div className="mt-5">{children}</div>
      </div>
      {footer ? <div className="mt-4 pb-2 text-center text-sm text-slate-500">{footer}</div> : null}
    </div>
  );
}

export function PublicAuthFooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={publicAuthLinkClassName}>
      {children}
    </Link>
  );
}
