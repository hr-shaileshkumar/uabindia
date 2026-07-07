"use client";

import Link from "next/link";
import { ChevronRight, House } from "lucide-react";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useUiSchema } from "@/context/UiSchemaContext";
import {
  buildWorkspaceModules,
  findWorkspaceModuleByPath,
  findWorkspacePageByPath,
} from "@/lib/erp/navigation";
import { canonicalizeProtectedPath } from "@/lib/erp/route-config";

type Crumb = {
  label: string;
  href?: string;
};

const formatSegmentLabel = (segment: string) => {
  const decoded = decodeURIComponent(segment);
  if (/^\d+$/.test(decoded)) {
    return `Record ${decoded}`;
  }

  return decoded
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const pushCrumb = (crumbs: Crumb[], crumb: Crumb) => {
  const lastCrumb = crumbs[crumbs.length - 1];
  if (lastCrumb?.label === crumb.label) {
    return;
  }

  crumbs.push(crumb);
};

export function AppBreadcrumbs() {
  const pathname = usePathname();
  const { navigation, enabledModules } = useUiSchema();

  const crumbs = useMemo(() => {
    const modules = buildWorkspaceModules(navigation.modules, enabledModules);
    const pageMatch = findWorkspacePageByPath(modules, pathname);
    const moduleMatch = findWorkspaceModuleByPath(modules, pathname);
    const nextCrumbs: Crumb[] = [{ label: "Workspace", href: "/context" }];

    if (pathname === "/context") {
      return nextCrumbs;
    }

    if (pageMatch) {
      const moduleHref = pageMatch.module.homeHref || pageMatch.item.path;
      pushCrumb(nextCrumbs, {
        label: pageMatch.module.label,
        href: moduleHref !== pageMatch.item.path ? moduleHref : undefined,
      });

      if (pageMatch.module.groups.length > 1 && pageMatch.group.label.toLowerCase() !== "pages") {
        pushCrumb(nextCrumbs, { label: pageMatch.group.label });
      }

      pushCrumb(nextCrumbs, { label: pageMatch.item.name });

      const comparablePathname = canonicalizeProtectedPath(pathname);
      const comparableItemPath = canonicalizeProtectedPath(pageMatch.item.path);
      const trailingSegments = comparablePathname
        .split("/")
        .filter(Boolean)
        .slice(comparableItemPath.split("/").filter(Boolean).length);

      for (const segment of trailingSegments) {
        pushCrumb(nextCrumbs, { label: formatSegmentLabel(segment) });
      }

      return nextCrumbs;
    }

    if (moduleMatch) {
      pushCrumb(nextCrumbs, { label: moduleMatch.label });
      return nextCrumbs;
    }

    for (const segment of pathname.split("/").filter(Boolean)) {
      if (segment === "erp") {
        continue;
      }

      pushCrumb(nextCrumbs, { label: formatSegmentLabel(segment) });
    }

    return nextCrumbs;
  }, [enabledModules, navigation.modules, pathname]);

  if (crumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="overflow-x-auto">
      <ol className="flex min-w-max items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/75 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 shadow-[var(--erp-shadow-sm)] backdrop-blur-sm">
        <li>
          <Link
            href={crumbs[0]?.href || "/context"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <House className="h-3.5 w-3.5" />
            <span className="sr-only">Workspace home</span>
          </Link>
        </li>

        {crumbs.slice(1).map((crumb, index) => {
          const isLast = index === crumbs.length - 2;

          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              {crumb.href && !isLast ? (
                <Link href={crumb.href} className="truncate rounded-lg px-2 py-1 transition hover:bg-slate-100 hover:text-slate-900">
                  {crumb.label}
                </Link>
              ) : (
                <span className={isLast ? "truncate text-slate-900" : "truncate"}>{crumb.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
