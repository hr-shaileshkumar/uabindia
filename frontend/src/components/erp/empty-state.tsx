import Link from "next/link";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-xl font-semibold text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-600">{description}</p>
      <Button asChild className="mt-5">
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}
