import Link from "next/link";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="rounded-[var(--erp-radius-panel)] border border-dashed border-slate-300 bg-white p-6 text-center shadow-[var(--erp-shadow-sm)] sm:p-8" role="status">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--erp-primary-muted)] text-[color:var(--erp-primary)]">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="mt-3 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      {onClick ? (
        <Button onClick={onClick} className="mt-5">
          {ctaLabel}
        </Button>
      ) : ctaHref ? (
        <Button asChild className="mt-5">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
