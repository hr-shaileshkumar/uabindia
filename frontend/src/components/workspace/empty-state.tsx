import Link from "next/link";
import { Inbox } from "lucide-react";
import { erpButtonClassName } from "@/components/workspace/styles";

export function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
  onClick,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm sm:p-8"
      role="status"
    >
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="mt-3 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      {onClick ? (
        <button type="button" onClick={onClick} className={`mt-5 ${erpButtonClassName.primary}`}>
          {ctaLabel}
        </button>
      ) : ctaHref ? (
        <Link href={ctaHref} className={`mt-5 inline-flex ${erpButtonClassName.primary}`}>
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
