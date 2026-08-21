"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import {
  erpActionCardClassName,
  erpActionCardIconClassName,
  erpActionCardSubtitleClassName,
  erpActionCardTitleClassName,
  erpPanelBodyClassName,
  erpPanelClassName,
  erpPanelHeaderClassName,
  erpPanelTitleClassName,
  erpStatCardClassName,
  erpStatCardHelperClassName,
  erpStatCardLabelClassName,
  erpStatCardValueClassName,
  erpStatusBadgeTone,
} from "@/components/erp/erpStyles";

export type WorkspaceHubStat = {
  label: string;
  value: string | number;
  helper?: string;
  href?: string;
  icon?: LucideIcon;
};

export type WorkspaceHubLink = {
  href: string;
  label: string;
  desc: string;
  icon: LucideIcon;
};

type ModuleWorkspaceHubProps = {
  title: string;
  subtitle: string;
  eyebrow: string;
  icon?: string;
  loading?: boolean;
  error?: string | null;
  stats?: WorkspaceHubStat[];
  links: WorkspaceHubLink[];
  linksTitle?: string;
  actions?: ReactNode;
  children?: ReactNode;
};

export function ModuleWorkspaceHub({
  title,
  subtitle,
  eyebrow,
  icon,
  loading,
  error,
  stats = [],
  links,
  linksTitle = "Workspace areas",
  actions,
  children,
}: ModuleWorkspaceHubProps) {
  return (
    <StandardPageLayout title={title} subtitle={subtitle} eyebrow={eyebrow} icon={icon} actions={actions}>
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      {stats.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((stat) => {
            const body = (
              <>
                <div className="flex items-center justify-between gap-2">
                  <p className={erpStatCardLabelClassName}>{stat.label}</p>
                  {stat.icon ? <stat.icon className="h-4 w-4 text-slate-400" /> : null}
                </div>
                <p className={erpStatCardValueClassName}>{loading ? "…" : stat.value}</p>
                {stat.helper ? <p className={erpStatCardHelperClassName}>{stat.helper}</p> : null}
              </>
            );
            return stat.href ? (
              <Link key={stat.label} href={stat.href} className={`${erpStatCardClassName} block transition hover:border-slate-300`}>
                {body}
              </Link>
            ) : (
              <div key={stat.label} className={erpStatCardClassName}>
                {body}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className={children ? "grid gap-5 xl:grid-cols-[1.2fr_0.8fr]" : undefined}>
        <section className={erpPanelClassName}>
          <div className={erpPanelHeaderClassName}>
            <h2 className={erpPanelTitleClassName}>{linksTitle}</h2>
            <span className={erpStatusBadgeTone.info}>{links.length} areas</span>
          </div>
          <div className={erpPanelBodyClassName}>
            <div className="grid gap-3 sm:grid-cols-2">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className={`${erpActionCardClassName} group flex items-start gap-3`}>
                  <span className={erpActionCardIconClassName}>
                    <link.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={erpActionCardTitleClassName}>{link.label}</p>
                    <p className={erpActionCardSubtitleClassName}>{link.desc}</p>
                  </div>
                  <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:text-slate-700" />
                </Link>
              ))}
            </div>
          </div>
        </section>
        {children}
      </div>
    </StandardPageLayout>
  );
}
