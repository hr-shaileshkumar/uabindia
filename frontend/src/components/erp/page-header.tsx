import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Crumb = { label: string; href?: string };

export function PageHeader({
  eyebrow,
  title,
  description,
  crumbs,
  primaryAction,
  secondaryAction,
}: {
  eyebrow: string;
  title: string;
  description: string;
  crumbs: Crumb[];
  primaryAction?: string;
  secondaryAction?: string;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {crumbs.map((crumb, index) => (
          <div key={`${crumb.label}-${index}`} className="flex items-center gap-2">
            {crumb.href ? <Link href={crumb.href} className="transition hover:text-slate-900">{crumb.label}</Link> : <span>{crumb.label}</span>}
            {index < crumbs.length - 1 ? <ChevronRight className="h-3.5 w-3.5 text-slate-300" /> : null}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">{eyebrow}</p>
          <h1 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950">{title}</h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {secondaryAction ? <Button variant="outline">{secondaryAction}</Button> : null}
          {primaryAction ? <Button>{primaryAction}</Button> : null}
        </div>
      </div>
    </div>
  );
}
