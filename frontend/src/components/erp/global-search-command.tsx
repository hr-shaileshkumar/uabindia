"use client";

import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import ModuleIcon from "@/components/ModuleIcon";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUiSchema } from "@/context/UiSchemaContext";
import {
  buildWorkspaceModules,
  flattenWorkspacePages,
  type WorkspaceModule,
} from "@/lib/erp/navigation";

type GlobalSearchCommandProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type SearchResultGroup = {
  module: WorkspaceModule;
  pages: Array<{
    name: string;
    path: string;
    icon?: string | null;
    groupLabel: string;
  }>;
};

const matchesSearch = (haystack: string, query: string) => haystack.toLowerCase().includes(query);

export function GlobalSearchCommand({
  open,
  onOpenChange,
}: GlobalSearchCommandProps) {
  const { navigation, enabledModules } = useUiSchema();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const modules = useMemo(
    () => buildWorkspaceModules(navigation.modules, enabledModules),
    [enabledModules, navigation.modules]
  );

  const results = useMemo<SearchResultGroup[]>(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const pages = flattenWorkspacePages(modules);

    if (!normalizedQuery) {
      return modules.slice(0, 6).map((workspaceModule) => ({
        module: workspaceModule,
        pages: workspaceModule.groups.flatMap((group) =>
          group.items.slice(0, 3).map((item) => ({
            name: item.name,
            path: item.path,
            icon: item.icon || workspaceModule.icon,
            groupLabel: group.label,
          }))
        ),
      }));
    }

    const groupedResults = new Map<string, SearchResultGroup>();

    for (const page of pages) {
      const searchableText = [
        page.module.label,
        page.module.key,
        page.group.label,
        page.item.name,
        page.item.path,
      ].join(" ");

      if (
        !matchesSearch(searchableText, normalizedQuery) &&
        !matchesSearch(page.module.description || "", normalizedQuery)
      ) {
        continue;
      }

      const existingGroup = groupedResults.get(page.module.key);
      const nextPage = {
        name: page.item.name,
        path: page.item.path,
        icon: page.item.icon || page.module.icon,
        groupLabel: page.group.label,
      };

      if (existingGroup) {
        existingGroup.pages.push(nextPage);
      } else {
        groupedResults.set(page.module.key, {
          module: page.module,
          pages: [nextPage],
        });
      }
    }

    for (const workspaceModule of modules) {
      const matchesModule =
        matchesSearch(`${workspaceModule.label} ${workspaceModule.key}`, normalizedQuery) ||
        matchesSearch(workspaceModule.description || "", normalizedQuery);

      if (!matchesModule || groupedResults.has(workspaceModule.key)) {
        continue;
      }

      groupedResults.set(workspaceModule.key, {
        module: workspaceModule,
        pages: workspaceModule.groups.flatMap((group) =>
          group.items.slice(0, 6).map((item) => ({
            name: item.name,
            path: item.path,
            icon: item.icon || workspaceModule.icon,
            groupLabel: group.label,
          }))
        ),
      });
    }

    return [...groupedResults.values()]
      .map((group) => ({
        ...group,
        pages: group.pages.slice(0, 6),
      }))
      .slice(0, 8);
  }, [deferredQuery, modules]);

  const totalResults = results.reduce((count, result) => count + result.pages.length, 0);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl rounded-[2rem] border border-slate-200 bg-white p-0 shadow-[0_32px_80px_rgba(15,23,42,0.16)]">
        <div className="border-b border-slate-200/80 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <Search className="h-5 w-5" />
            </div>

            <label className="relative flex-1">
              <span className="sr-only">Search workspace</span>
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search modules, pages, records, and workspace destinations"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-20 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:inline-flex">
                Esc
              </span>
            </label>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close search</span>
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span>{query.trim() ? `${totalResults} matches` : "Suggested destinations"}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
              Backend-driven navigation
            </span>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6">
          {results.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50/70 px-6 text-center">
              <p className="text-sm font-semibold text-slate-900">No navigation items match this search.</p>
              <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
                Try a module name, child page, or route keyword returned by the backend UI schema.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {results.map((result) => (
                <section
                  key={result.module.key}
                  className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
                        <ModuleIcon name={result.module.icon} className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{result.module.label}</p>
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                          {result.module.pageCount} pages
                        </p>
                      </div>
                    </div>

                    {result.module.homeHref ? (
                      <Link
                        href={result.module.homeHref}
                        onClick={() => onOpenChange(false)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
                      >
                        Open module
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {result.pages.map((page) => (
                      <Link
                        key={page.path}
                        href={page.path}
                        onClick={() => onOpenChange(false)}
                        className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-700 transition group-hover:bg-sky-50 group-hover:text-sky-700">
                            <ModuleIcon name={page.icon} className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="truncate text-sm font-semibold text-slate-950">{page.name}</p>
                              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-sky-700" />
                            </div>
                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                              {page.groupLabel}
                            </p>
                            <p className="mt-3 truncate text-sm text-slate-600">{page.path}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
