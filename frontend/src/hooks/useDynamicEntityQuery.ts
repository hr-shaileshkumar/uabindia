import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/apiClient";
import type { FilterGroup } from "@/lib/filter-engine/filter-ast";

export interface DynamicQueryParams {
  apiEndpoint?: string;
  companyId?: string;
  projectId?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  filterValues?: Record<string, string>;
  quickFilterValues?: Record<string, string>;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  filterAst?: FilterGroup | null;
  enabled?: boolean;
}

export interface DynamicQueryResult<T = any> {
  records: T[];
  totalRecords: number;
  serverTotalRecords: number | null;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
}

export function useDynamicEntityQuery<T = any>({
  apiEndpoint,
  companyId,
  projectId,
  page = 1,
  pageSize = 10,
  search = "",
  filterValues = {},
  quickFilterValues = {},
  sortKey = "",
  sortDirection = "asc",
  filterAst = null,
  enabled = true,
}: DynamicQueryParams): DynamicQueryResult<T> {
  const activeSearch = search.trim() || Object.values(quickFilterValues).find((v) => v?.trim())?.trim() || "";

  // Deterministic query key
  const queryKey = [
    "dynamic-entity",
    apiEndpoint,
    {
      companyId,
      projectId,
      page,
      pageSize,
      search: activeSearch,
      filterValues,
      sortKey,
      sortDirection,
      filterAst: filterAst?.rules?.length ? JSON.stringify(filterAst) : null,
    },
  ] as const;

  const query = useQuery({
    queryKey,
    enabled: Boolean(apiEndpoint) && enabled,
    staleTime: 30_000, // 30s cache retention before background revalidation
    gcTime: 5 * 60_000, // 5m in-memory cache
    placeholderData: (previousData) => previousData, // Seamless pagination without flashing spinners
    queryFn: async () => {
      if (!apiEndpoint) {
        return { records: [], totalRecords: 0 };
      }

      const params: Record<string, string> = {
        page: String(page),
        limit: String(pageSize),
        pageSize: String(pageSize),
      };

      if (companyId) params.companyId = companyId;
      if (projectId) params.projectId = projectId;
      if (activeSearch) params.search = activeSearch;

      for (const [key, val] of Object.entries(filterValues)) {
        if (val && val !== "all") {
          const cleanKey = key.replace(/^__/, "");
          params[cleanKey] = val;
        }
      }

      if (sortKey) {
        params.sortKey = sortKey;
        params.sortBy = sortKey;
        params.sortField = sortKey;
        params.sortDir = sortDirection;
        params.sortDirection = sortDirection;
      }

      if (filterAst && filterAst.rules.length > 0) {
        params.filterAst = JSON.stringify(filterAst);
      }

      const res = await apiClient.get(apiEndpoint, { params });
      const raw = res.data;

      let list: T[] = [];
      let total: number | null = null;

      // 1. Standard ApiResponse<T> with PaginationMetadata
      if (raw?.pagination) {
        total = raw.pagination.totalRecords ?? raw.pagination.totalCount ?? null;
      }

      // 2. Data array resolution
      if (Array.isArray(raw)) {
        list = raw;
      } else if (Array.isArray(raw?.data)) {
        list = raw.data;
      } else if (Array.isArray(raw?.data?.items)) {
        list = raw.data.items;
      } else if (Array.isArray(raw?.items)) {
        list = raw.items;
      } else if (Array.isArray(raw?.requests)) {
        list = raw.requests;
      } else if (Array.isArray(raw?.invoices)) {
        list = raw.invoices;
      } else if (Array.isArray(raw?.orders)) {
        list = raw.orders;
      } else if (Array.isArray(raw?.tasks)) {
        list = raw.tasks;
      } else if (Array.isArray(raw?.employees)) {
        list = raw.employees;
      } else if (Array.isArray(raw?.candidates)) {
        list = raw.candidates;
      } else if (raw && typeof raw === "object") {
        const found = Object.values(raw).find((v) => Array.isArray(v));
        if (Array.isArray(found)) {
          list = found as T[];
        }
      }

      // 3. Fallback total resolution
      if (total === null && raw && typeof raw === "object") {
        if (typeof raw.total === "number") total = raw.total;
        else if (typeof raw.totalCount === "number") total = raw.totalCount;
        else if (typeof raw.count === "number") total = raw.count;
        else if (typeof raw.recordsCount === "number") total = raw.recordsCount;
        else if (typeof raw.totalRecords === "number") total = raw.totalRecords;
      }

      return {
        records: list,
        totalRecords: total !== null ? total : list.length,
        serverTotalRecords: total,
      };
    },
  });

  return {
    records: query.data?.records || [],
    totalRecords: query.data?.totalRecords || 0,
    serverTotalRecords: query.data?.serverTotalRecords ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
