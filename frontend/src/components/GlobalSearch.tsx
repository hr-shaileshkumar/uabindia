"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Module } from "@/types";
import { ROUTES } from "@/constants/routes";

interface SearchItem {
  title: string;
  path: string;
  module: string;
  category: "module" | "page";
  description?: string;
}

export interface GlobalSearchProps {
  modules: Module[];
  onNavigate?: (path: string) => void;
}

export function GlobalSearch({ modules, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getModuleHomePath = useCallback((moduleEntry: Module) => {
    if (moduleEntry.basePath) {
      return moduleEntry.basePath;
    }

    switch (moduleEntry.key) {
      case "operations":
        return ROUTES.DASHBOARD;
      case "hrms":
        return ROUTES.HRMS_HOME;
      case "payroll":
        return ROUTES.PAYROLL_HOME;
      case "reports":
        return ROUTES.REPORTS_HOME;
      case "platform":
        return ROUTES.PLATFORM_HOME;
      case "licensing":
        return "/erp/licensing";
      case "security":
        return "/erp/security";
      default:
        return ROUTES.DASHBOARD;
    }
  }, []);

  // Build search index from modules
  const buildSearchIndex = useCallback((): SearchItem[] => {
    const items: SearchItem[] = [];

    modules.forEach((module) => {
      // Add module itself
      const moduleTitle = module.displayName || module.name;
      items.push({
        title: moduleTitle,
        path: getModuleHomePath(module),
        module: module.key,
        category: "module",
        description: module.description || `Jump to ${moduleTitle} module`,
      });

      // Add sub-modules/pages
      if (module.subModules && module.subModules.length > 0) {
        module.subModules.forEach((sub) => {
          items.push({
            title: sub.name,
            path: sub.path,
            module: module.key,
            category: "page",
            description: `${moduleTitle} › ${sub.name}`,
          });
        });
      }
    });

    return items;
  }, [modules, getModuleHomePath]);

  // Fuzzy search filter
  const fuzzyMatch = (str: string, pattern: string): boolean => {
    const patternLower = pattern.toLowerCase();
    const strLower = str.toLowerCase();
    
    // Direct includes for simple matches
    if (strLower.includes(patternLower)) return true;
    
    // Fuzzy matching: all pattern chars must appear in order
    let patternIdx = 0;
    for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
      if (strLower[i] === patternLower[patternIdx]) {
        patternIdx++;
      }
    }
    return patternIdx === patternLower.length;
  };

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const searchIndex = buildSearchIndex();
    const filtered = searchIndex.filter(
      (item) =>
        fuzzyMatch(item.title, query) ||
        fuzzyMatch(item.module, query) ||
        (item.description && fuzzyMatch(item.description, query))
    );

    // Sort by relevance (exact matches first)
    filtered.sort((a, b) => {
      const aExact = a.title.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0;
      const bExact = b.title.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0;
      return bExact - aExact;
    });

    return filtered.slice(0, 8);
  }, [query, buildSearchIndex]);

  const safeSelectedIndex = results.length === 0
    ? 0
    : Math.min(selectedIndex, results.length - 1);

  const handleSelect = useCallback((item: SearchItem) => {
    onNavigate?.(item.path);
    router.push(item.path);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  }, [onNavigate, router]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global shortcut: Cmd+K or Ctrl+K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
        return;
      }

      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[safeSelectedIndex]) {
            handleSelect(results[safeSelectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setQuery("");
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, safeSelectedIndex, handleSelect]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <input
          ref={inputRef}
          id="global-search"
          name="global-search"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search workspace, modules, pages..."
          className="h-10 w-full rounded-xl border border-slate-200 bg-linear-to-b from-white to-slate-50 pl-9 pr-24 text-sm text-slate-800 shadow-sm transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-600/20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="hidden sm:inline-block rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 shadow-sm">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full z-50 mt-2 max-h-96 w-full overflow-y-auto rounded-2xl border border-slate-200/90 bg-white/98 shadow-[0_18px_42px_rgba(15,23,42,0.12)] backdrop-blur-sm">
          {results.map((item, index) => (
            <button
              key={`search-result-${index}`}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 ${
                index === safeSelectedIndex
                  ? "bg-sky-50/90"
                  : "hover:bg-slate-50/90"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {item.description}
                    </p>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                  item.category === "module"
                    ? "bg-sky-100 text-sky-700"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {item.category === "module" ? "Module" : "Page"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && query && results.length === 0 && (
        <div className="absolute top-full z-50 mt-2 w-full rounded-2xl border border-slate-200/90 bg-white p-8 text-center shadow-[0_18px_42px_rgba(15,23,42,0.12)]">
          <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <p className="mt-4 text-sm text-slate-500">No results found for &quot;{query}&quot;</p>
          <p className="mt-1 text-xs text-slate-400">Try a different search term</p>
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
