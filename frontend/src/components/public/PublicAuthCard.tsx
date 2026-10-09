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
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.12)] sm:p-8 dark:border-slate-800/80 dark:bg-slate-900/95 dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.6)] backdrop-blur-md">
        {eyebrow ? <p className={cn(publicEyebrowClassName, "mb-3")}>{eyebrow}</p> : null}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
      {footer ? <div className="mt-4 pb-2 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">{footer}</div> : null}
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
