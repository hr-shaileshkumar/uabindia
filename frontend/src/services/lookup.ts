import { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "./apiClient";

export interface LookupItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
  category?: string;
  metadata?: Record<string, any>;
}

export interface LookupQuery {
  search?: string;
  companyId?: string;
  parentId?: string;
  limit?: number;
}

export interface LookupResult {
  type: string;
  items: LookupItem[];
  total: number;
}

// In-memory short-lived cache to avoid redundant round-trips for the same session
const lookupCache = new Map<string, { timestamp: number; data: LookupItem[] }>();
const CACHE_TTL_MS = 60_000; // 1 minute client-side TTL

/**
 * Fetches reference items for a single lookup category.
 */
export async function fetchLookup(type: string, query?: LookupQuery): Promise<LookupItem[]> {
  const cacheKey = `${type}:${JSON.stringify(query || {})}`;
  const cached = lookupCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const res = await apiClient.get<LookupResult>("/lookup", {
      params: {
        type,
        search: query?.search,
        companyId: query?.companyId,
        parentId: query?.parentId,
        limit: query?.limit || 100,
      },
    });

    const items = res.data?.items || [];
    lookupCache.set(cacheKey, { timestamp: Date.now(), data: items });
    return items;
  } catch {
    return [];
  }
}

/**
 * Fetches multiple lookup categories in 1 single HTTP request.
 */
export async function fetchBatchLookups(
  types: string[],
  companyId?: string
): Promise<Record<string, LookupItem[]>> {
  if (!types.length) return {};

  try {
    const res = await apiClient.get<{ lookups: Record<string, LookupItem[]> }>("/lookup/batch", {
      params: {
        types: types.join(","),
        companyId,
      },
    });

    const results = res.data?.lookups || {};
    // Prime the cache
    for (const [key, items] of Object.entries(results)) {
      const cacheKey = `${key}:${JSON.stringify({ companyId })}`;
      lookupCache.set(cacheKey, { timestamp: Date.now(), data: items });
    }
    return results;
  } catch {
    return {};
  }
}

/**
 * React hook for consuming a single lookup category with automatic state management.
 */
export function useLookup(type: string, query?: LookupQuery) {
  const [items, setItems] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey = useMemo(() => JSON.stringify(query || {}), [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const parsedQuery = queryKey ? JSON.parse(queryKey) : undefined;
      const data = await fetchLookup(type, parsedQuery);
      setItems(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load lookup items");
    } finally {
      setLoading(false);
    }
  }, [type, queryKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, refresh: load };
}

/**
 * React hook for preloading all select options for complex forms in 1 request.
 */
export function useBatchLookups(types: string[], companyId?: string) {
  const [lookups, setLookups] = useState<Record<string, LookupItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const typesKey = useMemo(() => types.sort().join(","), [types]);

  const load = useCallback(async () => {
    if (!typesKey) {
      setLookups({});
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBatchLookups(typesKey.split(","), companyId);
      setLookups(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load batch lookups");
    } finally {
      setLoading(false);
    }
  }, [typesKey, companyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { lookups, loading, error, refresh: load };
}
