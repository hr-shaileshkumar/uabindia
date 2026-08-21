"use client";

import Link from "next/link";
import { publicButtonClassName } from "@/components/public/publicStyles";
import { cn } from "@/lib/utils";

type StatusAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

type PublicStatusPageProps = {
  eyebrow?: string;
  title: string;
  description: string;
  note?: string;
  actions?: StatusAction[];
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export default function PublicStatusPage({
  eyebrow = "Notice",
  title,
  description,
  note,
  actions,
  primaryHref = "/",
  primaryLabel = "Go home",
  secondaryHref,
  secondaryLabel,
}: PublicStatusPageProps) {
  const resolvedActions: StatusAction[] =
    actions && actions.length > 0
      ? actions
      : [
          { href: primaryHref, label: primaryLabel, variant: "primary" },
          ...(secondaryHref && secondaryLabel
            ? [{ href: secondaryHref, label: secondaryLabel, variant: "secondary" as const }]
            : []),
        ];

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{eyebrow}</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
        {note ? <p className="mt-3 text-sm text-slate-500">{note}</p> : null}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {resolvedActions.map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className={cn(
                action.variant === "secondary" ? publicButtonClassName.secondary : publicButtonClassName.primary,
              )}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
