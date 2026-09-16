"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Star, ArrowRight, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiSchema } from "@/context/UiSchemaContext";
import { useNavigationStore } from "@/store/navigationStore";
import {
  buildWorkspaceModules,
  flattenWorkspacePages,
} from "@/lib/workspace/navigation";
import ModuleIcon from "@/components/ModuleIcon";

export interface FlatPageItem {
  name: string;
  path: string;
  icon?: string | null;
  groupLabel: string;
  moduleName?: string;
  moduleKey?: string;
}

export function HeaderSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { navigation, enabledModules } = useUiSchema();
  const favorites = useNavigationStore((state) => state.favorites);
  const addRecent = useNavigationStore((state) => state.addRecent);

  // Build full catalog of workspace pages
  const modules = useMemo(
    () => buildWorkspaceModules(navigation.modules, enabledModules),
    [enabledModules, navigation.modules]
  );

  const allPages = useMemo(() => {
    const list: FlatPageItem[] = [];
    const seen = new Set<string>();

    for (const mod of modules) {
      for (const grp of mod.groups) {
        for (const it of grp.items) {
          if (!it.path || seen.has(it.path)) continue;
          seen.add(it.path);
          list.push({
            name: it.name,
            path: it.path,
            icon: it.icon || mod.icon,
            groupLabel: grp.label || mod.label,
            moduleName: mod.label,
            moduleKey: mod.key,
          });
        }
      }
    }
    return list;
  }, [modules]);

  // Filter matching pages, submodules, and modules in real-time
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default: Return popular/pinned pages
      return allPages.slice(0, 8);
    }

    return allPages
      .filter((page) => {
        const matchName = page.name.toLowerCase().includes(q);
        const matchGroup = page.groupLabel.toLowerCase().includes(q);
        const matchModule = (page.moduleName || "").toLowerCase().includes(q);
        const matchPath = page.path.toLowerCase().includes(q);
        return matchName || matchGroup || matchModule || matchPath;
      })
      .slice(0, 15);
  }, [query, allPages]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  // Global Keyboard listener for Ctrl+K, Cmd+K, and /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputFocused = activeTag === "input" || activeTag === "textarea" || activeTag === "select";

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "/" && !isInputFocused) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPage = (page: FlatPageItem) => {
    addRecent({
      id: page.path,
      label: page.name,
      href: page.path,
      icon: (page.icon as string) || undefined,
    });
    setIsOpen(false);
    setQuery("");
    router.push(page.path);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredResults.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelectPage(filteredResults[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="relative flex flex-1 justify-center max-w-md mx-2">
      {/* Search Input Box */}
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search modules, submodules, pages…"
          className={cn(
            "h-8.5 w-full rounded-xl border border-slate-200 bg-slate-50/90 pl-9 pr-14 text-xs font-medium text-slate-900 transition-all",
            "placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/15",
            "dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 dark:focus:border-blue-400"
          )}
        />

        {/* Right action: Clear button or Ctrl K badge */}
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-4.5 w-4.5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <X className="h-3 w-3" />
          </button>
        ) : (
          <kbd
            onClick={() => inputRef.current?.focus()}
            className="pointer-events-auto cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-400 font-mono shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
          >
            Ctrl K
          </kbd>
        )}
      </div>

      {/* Live Dropdown positioned directly UNDER the search box */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[380px] overflow-y-auto rounded-2xl border border-slate-200 bg-white/98 p-1.5 shadow-2xl backdrop-blur-md scrollbar-thin dark:border-slate-800 dark:bg-slate-900/98 animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Header row / Hint */}
          <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1">
            <span>{query ? `Matching Results (${filteredResults.length})` : "Quick Navigation"}</span>
            <span className="font-mono text-[9px] font-normal lowercase">Use ↑ ↓ and Enter</span>
          </div>

          {filteredResults.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              No matching pages or modules found for &quot;<span className="font-semibold text-slate-700 dark:text-slate-300">{query}</span>&quot;
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredResults.map((page, index) => {
                const isSelected = index === selectedIndex;
                const isFav = favorites.some((f) => f.href === page.path);

                return (
                  <div
                    key={page.path}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => handleSelectPage(page)}
                    className={cn(
                      "group flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs transition-colors cursor-pointer",
                      isSelected
                        ? "bg-blue-50/90 text-blue-900 font-semibold dark:bg-blue-950/50 dark:text-blue-200"
                        : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-700 dark:group-hover:bg-blue-900/60 dark:group-hover:text-blue-300"
                        )}
                      >
                        <ModuleIcon name={page.icon as string} className="h-4 w-4" />
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {page.name}
                        </p>
                        <p className="truncate text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <span>{page.moduleName}</span>
                          {page.groupLabel && page.groupLabel !== page.moduleName ? (
                            <>
                              <span>›</span>
                              <span>{page.groupLabel}</span>
                            </>
                          ) : null}
                          <span className="font-mono text-[9px] opacity-60">({page.path})</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isFav && <Star className="h-3 w-3 fill-amber-400 text-amber-500" />}
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                          <CornerDownLeft className="h-3 w-3" />
                        </span>
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HeaderSearch;
