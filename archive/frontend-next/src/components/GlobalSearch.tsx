"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Module } from "@/types";

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

  // Build search index from modules
  const buildSearchIndex = useCallback((): SearchItem[] => {
    const items: SearchItem[] = [];

    modules.forEach((module) => {
      // Add module itself
      items.push({
        title: module.name,
        path: `/app/${module.key}`,
        module: module.key,
        category: "module",
        description: `Jump to ${module.name} module`,
      });

      // Add sub-modules/pages
      if (module.subModules && module.subModules.length > 0) {
        module.subModules.forEach((sub) => {
          items.push({
            title: sub.name,
            path: sub.path,
            module: module.key,
            category: "page",
            description: `${module.name} › ${sub.name}`,
          });
        });
      }
    });

    return items;
  }, [modules]);

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
          placeholder="Search modules and pages..."
          className="w-full h-9 pl-9 pr-20 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-mono text-gray-500 bg-white border border-gray-200 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          {results.map((item, index) => (
            <button
              key={`search-result-${index}`}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-4 py-2.5 border-b border-gray-100 last:border-b-0 transition ${
                index === safeSelectedIndex
                  ? "bg-blue-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>
                <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded ${
                  item.category === "module"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600"
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
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <p className="mt-4 text-sm text-gray-500">No results found for &quot;{query}&quot;</p>
          <p className="mt-1 text-xs text-gray-400">Try a different search term</p>
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
