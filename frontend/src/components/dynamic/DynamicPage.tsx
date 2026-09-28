"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  CheckCircle2,
  Clock,
  Briefcase,
  Layers,
  AlertTriangle,
  RefreshCw,
  Plus,
  Pencil,
  ExternalLink,
  Upload,
  Columns3,
  ArrowLeft,
  Save,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Heart,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { SideDrawer } from "@/components/ui/side-drawer";
import { UniversalDeleteDialog } from "@/components/workspace/templates/UniversalDeleteDialog";
import { UniversalBulkImportModal } from "@/components/workspace/UniversalBulkImportModal";
import { UniversalExportModal } from "@/components/workspace/UniversalExportModal";
import { PageCustomizationModal } from "./PageCustomizationModal";
import { DynamicForm } from "./DynamicForm";
import { renderDynamicTableCell, cleanFieldLabel } from "./DynamicFieldRegistry";
import { DynamicRecordTimeline } from "./engine/DynamicRecordTimeline";
import { DynamicKanbanView } from "./engine/DynamicKanbanView";
import {
  ErpFrappeListToolbar,
  ErpFrappeTableView,
  ErpCardGridView,
  ErpReportView,
  type ErpViewMode,
  type FilterRule,
} from "@/components/erp/data-table";
import { platformApi } from "@/services/modules/administration";
import { appApi } from "@/services/modules";
import apiClient from "@/services/apiClient";
import { useDynamicEntityQuery } from "@/hooks/useDynamicEntityQuery";
import { usePermissions } from "@/context/PermissionContext";
import { useAuth } from "@/context/AuthContext";
import { useOrgContext } from "@/context/OrgContext";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { cn } from "@/lib/utils";
import type { DynamicPageSchema } from "@/lib/dynamic-schema/types";
import { getCatalogSchema } from "@/lib/metadata/catalog";
import type { PageSchema } from "@/lib/metadata/types";
import { usePageCustomizationStore } from "@/store/pageCustomizationStore";
import {
  evaluateFilterAst,
  filterAstToHumanReadable,
  type FilterGroup,
} from "@/lib/filter-engine/filter-ast";
import {
  printRecordDocument,
  printTabularReport,
} from "@/lib/document-engine/document-print-engine";

export function pageSchemaToDynamicSchema(cat: PageSchema): DynamicPageSchema {
  return {
    schemaVersion: "1.0",
    pageKey: cat.pageKey,
    title: cat.title,
    subTitle: cat.subTitle,
    entityName: cat.entityName,
    moduleKey: cat.moduleKey,
    pageFamily: cat.pageFamily as any,
    pageType: cat.pageType as any,
    viewType: cat.viewType === "kanban" ? "kanban" : cat.viewType === "split" ? "split" : "table",
    apiEndpoint: cat.apiEndpoint || `/api/v1/${cat.pageKey.replace(".", "/")}`,
    columns: (cat.columns || []).map((c) => ({
      key: c.key,
      label: c.label,
      dataType: (c.type === "text" ? "string" : c.type || "string") as any,
      sortable: c.sortable ?? true,
      filterable: true,
      hidden: c.defaultVisible === false,
      width: c.width ? String(c.width) : undefined,
    })),
    filters: (cat.filters || []).map((f) => ({
      key: f.key,
      label: f.label,
      filterType: f.type === "select" ? "select" : "text",
      placeholder: f.placeholder,
      options: f.options,
    })),
    form: {
      sections: (cat.form?.sections || []).map((s) => ({
        title: s.label || s.key,
        description: s.description,
        fields: (s.fields || []).map((f) => ({
          key: f.key,
          label: f.label,
          fieldType: (f.type === "text" ? "text" : f.type) as any,
          required: f.required,
          readOnly: f.readOnly,
          placeholder: f.placeholder,
          defaultValue: f.defaultValue,
          helpText: f.helpText,
          colSpan: (f.span === 2 ? 2 : f.span === 3 ? 3 : f.span === 4 ? 4 : 1) as any,
          options: f.options,
          optionsEndpoint: f.lookupEndpoint,
          lookupValueKey: f.lookupValueKey,
          lookupLabelKey: f.lookupLabelKey,
        })),
      })),
    },
    actions: (cat.actions || []).map((a) => ({
      key: a.key,
      label: a.label,
      actionType: "button" as const,
      variant: a.variant === "danger" ? "danger" : a.variant === "secondary" ? "secondary" : "primary",
      icon: a.icon,
      requiredPermission: a.requiredPermission,
    })),
    kpiMetrics: (cat.kpis || []).map((k) => ({
      label: k.label,
      value: k.value ?? "0",
      subtext: k.subtext,
      tone: "neutral" as const,
      icon: k.icon || "Layers",
    })),
    workflowConfig: cat.workflowConfig ? {
      enabled: cat.workflowConfig.enabled,
      stateField: cat.workflowConfig.stateField,
      initialState: cat.workflowConfig.initialState,
      states: cat.workflowConfig.states,
      transitions: cat.workflowConfig.transitions,
    } : undefined,
    hasTimeline: cat.hasTimeline,
    hasAttachments: cat.hasAttachments,
  };
}


interface DynamicPageProps {
  pageKey: string;
  fallback?: React.ReactNode;
  renderMode?: "auto" | "dynamic" | "legacy";
  initialSchema?: DynamicPageSchema;
  previewMode?: boolean;
  companyId?: string;
  projectId?: string;
  initialDrawerMode?: "closed" | "create" | "edit";
  initialRecord?: any;
}

const KPI_ICONS: Record<string, React.ReactNode> = {
  Users: <Users className="h-3.5 w-3.5" />,
  CheckCircle2: <CheckCircle2 className="h-3.5 w-3.5" />,
  Clock: <Clock className="h-3.5 w-3.5" />,
  Briefcase: <Briefcase className="h-3.5 w-3.5" />,
  Layers: <Layers className="h-3.5 w-3.5" />,
};

const CANONICAL_PAGE_ENDPOINTS: Record<string, string> = {
  "hrms.employment-types": "/api/v1/hrms/employment-types",
  "hrms.grades": "/api/v1/hrms/grades",
  "hrms.leave-types": "/api/v1/hrms/leave-types",
  "administration.number-ranges": "/api/v1/administration/number-ranges",
  "administration.payment-terms": "/api/v1/payment-terms",
  "assets.fleet": "/api/v1/fleet",
  "projects.field-service": "/api/v1/field-service",
  "procurement.vendor-bills": "/api/v1/vendor-bills",
  "finance.vendor-bills": "/api/v1/vendor-bills",
  "inventory.wms": "/api/v1/inventory/warehouses",
  "inventory.warehouse-management": "/api/v1/inventory/warehouses",
  "procurement.grn": "/api/v1/grn",
  "procurement.goods-receipt-notes": "/api/v1/grn",
  "crm.customers": "/api/v1/crm/customers",
  "sales.customers": "/api/v1/crm/customers",
};

export function resolveDefaultApiEndpoint(pageKey: string): string {
  const normalized = pageKey.toLowerCase().trim();
  if (CANONICAL_PAGE_ENDPOINTS[normalized]) {
    return CANONICAL_PAGE_ENDPOINTS[normalized];
  }
  const parts = normalized.split(".");
  if (parts.length >= 2) {
    return `/api/v1/${parts[0]}/${parts.slice(1).join("/")}`;
  }
  return `/api/v1/${normalized}`;
}

export function DynamicPage({
  pageKey,
  fallback,
  renderMode = "auto",
  initialSchema,
  previewMode = false,
  companyId,
  projectId,
  initialDrawerMode = "closed",
  initialRecord = null,
}: DynamicPageProps) {
  const router = useRouter();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const { user } = useAuth();
  const {
    companyId: ctxCompanyId,
    projectId: ctxProjectId,
    companyName: ctxCompanyName,
    companyLegalName: ctxCompanyLegalName,
    companyLogoUrl: ctxCompanyLogoUrl,
    companyAddress: ctxCompanyAddress,
    companyGstin: ctxCompanyGstin,
    companyBrandColor: ctxCompanyBrandColor,
    companyAccentColor: ctxCompanyAccentColor,
    companyLetterheadLayout: ctxCompanyLetterheadLayout,
    projectName: ctxProjectName,
    projectSiteAddress: ctxProjectSiteAddress,
    projectClientLogoUrl: ctxProjectClientLogoUrl,
    projectSignatoryName: ctxProjectSignatoryName,
    projectSignatoryTitle: ctxProjectSignatoryTitle,
  } = useOrgContext();

  const effectiveCompanyId = companyId || ctxCompanyId || undefined;
  const effectiveProjectId = projectId || ctxProjectId || undefined;

  // Schema state - seeded synchronously from catalog for instant (0ms) layout reflection
  const [schema, setSchema] = useState<DynamicPageSchema | null>(() => {
    if (initialSchema) return initialSchema;
    const cat = getCatalogSchema(pageKey);
    return cat ? pageSchemaToDynamicSchema(cat) : null;
  });
  const [schemaLoading, setSchemaLoading] = useState(() => !schema);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  // Filter & Search input state
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // ── Frappe List View Enhancements State ──
  const [viewMode, setViewMode] = useState<ErpViewMode>("list");
  const [quickFilterValues, setQuickFilterValues] = useState<Record<string, string>>({});
  const [advancedFilters, setAdvancedFilters] = useState<FilterRule[]>([]);
  const [filterAst, setFilterAst] = useState<FilterGroup | null>(null);
  const [sortKey, setSortKey] = useState<string>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(`erp_favorites_${pageKey}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [activeTimelineRecord, setActiveTimelineRecord] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounced search for zero-lag typing
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // ── TanStack Query Enterprise Data Layer (Phase 2 P0) ──
  const {
    records,
    serverTotalRecords,
    isLoading: isDataLoading,
    isFetching: isDataFetching,
    error: queryError,
    refetch: queryRefetch,
  } = useDynamicEntityQuery({
    apiEndpoint: schema?.apiEndpoint,
    companyId: effectiveCompanyId,
    projectId: effectiveProjectId,
    page: currentPage,
    pageSize,
    search: debouncedSearch,
    filterValues,
    quickFilterValues,
    sortKey,
    sortDirection,
    filterAst,
    enabled: Boolean(schema?.apiEndpoint),
  });

  const [isActionLoading, setIsActionLoading] = useState(false);
  const loadingData = isDataLoading || isDataFetching || isActionLoading;
  const dataError = queryError ? getApiErrorMessage(queryError, "Failed to load data.") : null;

  const fetchData = useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  // Saved Views store integration
  const pageCustomization = usePageCustomizationStore((state) => state.pages[pageKey]);
  const saveView = usePageCustomizationStore((state) => state.saveView);
  const deleteView = usePageCustomizationStore((state) => state.deleteView);
  const activateView = usePageCustomizationStore((state) => state.activateView);
  const setActiveFiltersInStore = usePageCustomizationStore((state) => state.setActiveFilters);
  const setSortInStore = usePageCustomizationStore((state) => state.setSort);
  const setDensityInStore = usePageCustomizationStore((state) => state.setDensity);
  const syncViewsFromServer = usePageCustomizationStore((state) => state.syncViewsFromServer);

  const density = pageCustomization?.density || "normal";

  const handleToggleFavorite = useCallback(
    (id: string) => {
      setFavorites((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        try {
          localStorage.setItem(`erp_favorites_${pageKey}`, JSON.stringify(next));
        } catch {
          // safe fallback
        }
        return next;
      });
    },
    [pageKey]
  );
  const [drawerMode, setDrawerMode] = useState<"closed" | "create" | "edit">(initialDrawerMode);
  const [editingRecord, setEditingRecord] = useState<any | null>(initialRecord);
  const [isSaving, setIsSaving] = useState(false);

  const handleCloseDrawer = useCallback(() => {
    setDrawerMode("closed");
    setEditingRecord(null);
    if (typeof window !== "undefined" && window.location.search) {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has("action") || url.searchParams.has("edit")) {
          url.searchParams.delete("action");
          url.searchParams.delete("edit");
          window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
        }
      } catch {
        // Safe fallback
      }
    }
  }, []);

  // Synchronize drawer mode with query parameters (?action=create, ?edit=<id>)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const action = searchParams.get("action");
      const editId = searchParams.get("edit");
      if (action === "create") {
        setDrawerMode("create");
        setEditingRecord(null);
      } else if (editId) {
        if (records.length > 0) {
          const match = records.find(
            (r) => String(r.id || r[schema?.idField || "id"]) === editId
          );
          if (match) {
            setEditingRecord(match);
            setDrawerMode("edit");
          }
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, [records, schema?.idField]);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Import and Column Visibility state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedExportIds, setSelectedExportIds] = useState<string[]>([]);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<string[]>([]);

  // Global Keyboard Accelerators (Ctrl+S / Cmd+S to submit active form, Escape to close/cancel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (drawerMode !== "closed") {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          const formElement = document.getElementById("dynamic-record-form") as HTMLFormElement | null;
          if (formElement) {
            formElement.requestSubmit();
          }
        } else if (e.key === "Escape" && !deleteTarget && !isCustomizationOpen && !isImportModalOpen) {
          e.preventDefault();
          handleCloseDrawer();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerMode, deleteTarget, isCustomizationOpen, isImportModalOpen, handleCloseDrawer]);

  // Load Page Schema (resolving company/project scope from backend)
  const loadSchema = useCallback(async () => {
    if (initialSchema) {
      setSchema(initialSchema);
      setSchemaLoading(false);
      return;
    }
    if (renderMode === "legacy") {
      setSchemaLoading(false);
      return;
    }

    try {
      if (!schema) {
        setSchemaLoading(true);
      }
      setSchemaError(null);
      let foundSchema: DynamicPageSchema | null = null;

      // 1. Try DB schema from backend API
      try {
        const res = await platformApi.uiPages.get(pageKey, {
          draft: previewMode,
          companyId: effectiveCompanyId,
          projectId: effectiveProjectId,
        });
        const raw = res.data;
        if (raw && raw.schemaJson) {
          const parsed: DynamicPageSchema =
            typeof raw.schemaJson === "string" ? JSON.parse(raw.schemaJson) : raw.schemaJson;

          if (
            parsed &&
            ((parsed.columns && parsed.columns.length > 0) ||
              (parsed.form?.sections && parsed.form.sections.length > 0) ||
              parsed.viewType === "split")
          ) {
            foundSchema = parsed;
          }
        }
      } catch {
        // Continue to Tier 2 catalog
      }

      // 2. If not found in DB API, check built-in Metadata Catalog (Zero-hardcode Tier 2)
      if (!foundSchema) {
        const catalog = getCatalogSchema(pageKey);
        if (catalog) {
          foundSchema = pageSchemaToDynamicSchema(catalog);
        }
      }

      // 2b. If still not in catalog, auto-synthesize an enterprise metadata schema (Zero-hardcode Tier 2b)
      if (!foundSchema) {
        const parts = pageKey.split(".");
        const rawEntity = parts[parts.length - 1] || "Record";
        const title = rawEntity
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

        foundSchema = {
          schemaVersion: "1.0",
          pageKey,
          title,
          subTitle: `Enterprise ${title} registry and record management.`,
          entityName: title,
          viewType: "table",
          apiEndpoint: resolveDefaultApiEndpoint(pageKey),
          columns: [
            { key: "code", label: "Code", dataType: "string", sortable: true, filterable: true },
            { key: "name", label: "Name", dataType: "string", sortable: true, filterable: true },
            { key: "status", label: "Status", dataType: "badge", sortable: true, filterable: true },
            { key: "createdAt", label: "Created Date", dataType: "date", sortable: true, filterable: true },
          ],
          filters: [
            { key: "search", label: `Search ${title}`, filterType: "text" },
          ],
          form: {
            sections: [
              {
                title: `${title} Details`,
                fields: [
                  { key: "code", label: "Code", fieldType: "text", required: true, colSpan: 1 },
                  { key: "name", label: "Name", fieldType: "text", required: true, colSpan: 1 },
                  { key: "description", label: "Description / Notes", fieldType: "textarea", colSpan: 2 },
                  {
                    key: "status",
                    label: "Status",
                    fieldType: "select",
                    colSpan: 1,
                    options: [
                      { value: "Active", label: "Active" },
                      { value: "Inactive", label: "Inactive" },
                    ],
                  },
                ],
              },
            ],
          },
          actions: [
            { key: "create", label: `New ${title}`, actionType: "button", variant: "primary", icon: "Plus" },
          ],
          kpiMetrics: [
            { label: `Total ${title}`, value: "0", tone: "neutral", icon: "Layers" },
          ],
        };
      }

      // 3. Set resolved schema
      setSchema(foundSchema);
    } catch (err) {
      setSchema(null);
      setSchemaError(getApiErrorMessage(err, "Page schema not found."));
    } finally {
      setSchemaLoading(false);
    }
  }, [pageKey, initialSchema, renderMode, previewMode, effectiveCompanyId, effectiveProjectId, fallback]);

  useEffect(() => {
    void loadSchema();
  }, [loadSchema]);

  useEffect(() => {
    if (pageKey) {
      void syncViewsFromServer(pageKey);
    }
  }, [pageKey, syncViewsFromServer]);

  useEffect(() => {
    const handleContextChanged = () => {
      void loadSchema();
      void fetchData();
    };
    window.addEventListener("erp:org-context-changed", handleContextChanged);
    window.addEventListener("erp:tenant-changed", handleContextChanged);
    return () => {
      window.removeEventListener("erp:org-context-changed", handleContextChanged);
      window.removeEventListener("erp:tenant-changed", handleContextChanged);
    };
  }, [loadSchema, fetchData]);

  const BLACKLISTED_TECHNICAL_KEYS = useMemo(() => new Set([
    "accessfailedcount",
    "emailhash",
    "passwordhash",
    "concurrencystamp",
    "securitystamp",
    "lockoutenabled",
    "lockoutend",
    "normalizedemail",
    "normalizedusername",
    "issystemadmin",
    "businessid",
    "companyid",
    "tenantid",
    "tenant_id",
    "tenant",
    "tenantcode",
    "tenant_code",
    "twofactorenabled",
    "phonenumberconfirmed",
    "emailconfirmed",
    "rowversion",
    "isdeleted",
    "createdby",
    "updatedby",
    "deletedby",
    "deletedat",
    "passwordresettoken",
    "passwordresetexpires",
    "twofactorsecret",
    "refreshtoken",
    "refreshtokenexpiresat",
    "otp",
    "secret",
  ]), []);

  const visibleColumns = useMemo(() => {
    if (!schema?.columns) return [];
    const userRoles = user?.roles || (user?.role ? [user.role] : []);
    return (schema.columns || [])
      .filter((c) => {
        if (c.hidden || hiddenColumnKeys.includes(c.key) || BLACKLISTED_TECHNICAL_KEYS.has(c.key.toLowerCase())) {
          return false;
        }
        if (c.requiredPermission && !isSuperAdmin && !hasPermission([c.requiredPermission])) {
          return false;
        }
        if (c.security?.restrictedPermissions && c.security.restrictedPermissions.length > 0) {
          if (!isSuperAdmin && !hasPermission(c.security.restrictedPermissions)) {
            return false;
          }
        }
        if (c.security?.restrictedRoles && c.security.restrictedRoles.length > 0) {
          if (!isSuperAdmin && !userRoles.some((r) => c.security!.restrictedRoles!.includes(r))) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [schema?.columns, hiddenColumnKeys, BLACKLISTED_TECHNICAL_KEYS, hasPermission, isSuperAdmin, user]);

  // ── Facets — must be declared BEFORE any early returns (Rules of Hooks) ──
  const uniqueStatusValues = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      const s = r.status ?? (r.isActive === true ? "Active" : r.isActive === false ? "Inactive" : null);
      if (s) set.add(String(s));
    });
    return Array.from(set);
  }, [records]);

  const uniqueRoleValues = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      const v = r.role || r.roleName || r.designation || r.designationName || r.type;
      if (v) set.add(String(v));
    });
    return Array.from(set);
  }, [records]);

  // Quick filter chips generated from columns (ID, Full Name, Project, etc.)
  const quickFilterFields = useMemo(() => {
    if (!schema?.columns) return [];
    return schema.columns
      .filter((c) => !c.hidden && c.key !== "actions" && c.key !== "_")
      .slice(0, 5)
      .map((c) => ({
        key: c.key,
        label: c.label,
        placeholder: c.label,
      }));
  }, [schema?.columns]);

  // Relative time helper
  const getRelativeTime = useCallback((row: any) => {
    const rawDate = row.updatedAt || row.updated_at || row.lastUpdatedOn || row.createdAt || row.created_at;
    if (!rawDate) return "1 d";
    try {
      const diffMs = Date.now() - new Date(rawDate).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return "Just now";
      if (diffDays < 7) return `${diffDays} d`;
      const diffWeeks = Math.floor(diffDays / 7);
      if (diffWeeks < 4) return `${diffWeeks} w`;
      return `${Math.floor(diffDays / 30)} mo`;
    } catch {
      return "1 d";
    }
  }, []);

  // Filter, search, and sort records (Unconditionally declared hook)
  const filteredRecords = useMemo(() => {
    let result = records.filter((rec) => {
      // 1. General search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesSearch = Object.values(rec).some(
          (val) => typeof val === "string" && val.toLowerCase().includes(q)
        );
        if (!matchesSearch) return false;
      }

      // 2. Dropdown filter values
      for (const [key, val] of Object.entries(filterValues)) {
        if (val && val !== "all") {
          if (key === "__status") {
            const s = String(rec.status ?? (rec.isActive === true ? "Active" : rec.isActive === false ? "Inactive" : "")).toLowerCase();
            if (s !== val.toLowerCase()) return false;
            continue;
          }
          if (key === "__role") {
            const v = String(rec.role || rec.roleName || rec.designation || rec.designationName || rec.type || "").toLowerCase();
            if (v !== val.toLowerCase()) return false;
            continue;
          }
          if (String(rec[key] ?? "").toLowerCase() !== val.toLowerCase()) {
            return false;
          }
        }
      }

      // 3. Quick filter input chips
      for (const [key, val] of Object.entries(quickFilterValues)) {
        if (val && val.trim() !== "") {
          const recVal = String(rec[key] ?? "").toLowerCase();
          if (!recVal.includes(val.toLowerCase().trim())) {
            return false;
          }
        }
      }

      // 4. Advanced Filter Rules from Floating Popover (Equals, Like, etc.)
      for (const rule of advancedFilters) {
        if (!rule.value || !rule.value.trim()) continue;
        const targetVal = String(rec[rule.field] ?? "").toLowerCase();
        const filterVal = rule.value.toLowerCase().trim();

        if (rule.operator === "equals") {
          if (targetVal !== filterVal) return false;
        } else if (rule.operator === "not_equals") {
          if (targetVal === filterVal) return false;
        } else if (rule.operator === "contains" || rule.operator === "like") {
          if (!targetVal.includes(filterVal)) return false;
        } else if (rule.operator === "starts_with") {
          if (!targetVal.startsWith(filterVal)) return false;
        } else if (rule.operator === "greater_than") {
          if (!(Number(targetVal) > Number(filterVal) || targetVal > filterVal)) return false;
        } else if (rule.operator === "less_than") {
          if (!(Number(targetVal) < Number(filterVal) || targetVal < filterVal)) return false;
        } else if (rule.operator === "in") {
          const parts = filterVal.split(",").map((s) => s.trim());
          if (!parts.includes(targetVal)) return false;
        }
      }

      // 5. Universal Compound Filter AST (AND / OR Groups)
      if (filterAst && filterAst.rules.length > 0) {
        if (!evaluateFilterAst(rec, filterAst)) {
          return false;
        }
      }

      return true;
    });

    // 5. Sort records based on sortKey and sortDirection
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const valA = a[sortKey] ?? "";
        const valB = b[sortKey] ?? "";
        const numA = Number(valA);
        const numB = Number(valB);
        let comparison = 0;
        if (!isNaN(numA) && !isNaN(numB) && valA !== "" && valB !== "") {
          comparison = numA - numB;
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [records, search, filterValues, quickFilterValues, advancedFilters, sortKey, sortDirection]);

  // ── Early returns AFTER all hooks ──────────────────────────────────────────

  // Fallback to legacy page if in legacy mode or schema missing
  if (!schemaLoading && !schema && fallback) {
    return <>{fallback}</>;
  }

  // Schema Loading State
  if (schemaLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-center">
        <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold text-slate-500">Loading dynamic page schema…</p>
      </div>
    );
  }

  // Schema Error State (Graceful failure)
  if (!schema && schemaError) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="mx-auto my-12 max-w-lg rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-xs">
        <AlertTriangle className="mx-auto h-10 w-10 text-rose-500" />
        <h3 className="mt-3 text-sm font-bold text-slate-900">Unable to load page configuration</h3>
        <p className="mt-1 text-xs text-slate-500">{schemaError}</p>
        <p className="mt-3 text-[11px] font-mono text-slate-400">Page Key: {pageKey}</p>
        <button
          type="button"
          onClick={() => void loadSchema()}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  if (!schema) return null;



  // Calculate dynamic KPIs
  const kpis = (schema.kpiMetrics || []).map((kpi) => {
    let computedVal = kpi.value;
    if (computedVal === undefined) {
      if (kpi.label.toLowerCase().includes("total")) {
        computedVal = records.length;
      } else if (kpi.label.toLowerCase().includes("active")) {
        computedVal = records.filter((r) => String(r.status ?? r.isActive).toLowerCase() === "active" || r.isActive === true).length;
      } else {
        computedVal = records.length;
      }
    }
    return {
      label: kpi.label,
      value: computedVal,
      tone: kpi.tone || ("info" as const),
      icon: kpi.icon && KPI_ICONS[kpi.icon] ? KPI_ICONS[kpi.icon] : <Layers className="h-3.5 w-3.5" />,
      subtext: kpi.subtext,
    };
  });

  // Permissions check
  const canCreate =
    isSuperAdmin ||
    !schema.actions?.find((a) => a.key === "create")?.requiredPermission ||
    hasPermission([schema.actions.find((a) => a.key === "create")!.requiredPermission!]);

  const canEdit =
    isSuperAdmin ||
    !schema.actions?.find((a) => a.key === "edit")?.requiredPermission ||
    hasPermission([schema.actions.find((a) => a.key === "edit")!.requiredPermission!]);

  const canDelete =
    isSuperAdmin ||
    !schema.actions?.find((a) => a.key === "delete")?.requiredPermission ||
    hasPermission([schema.actions.find((a) => a.key === "delete")!.requiredPermission!]);

  // Form Save Handler
  const handleSaveForm = async (formData: Record<string, any>) => {
    try {
      setIsSaving(true);
      const idKey = schema.idField || "id";

      // Automatically scope to the active Company and Project if not explicitly chosen
      const payload: Record<string, any> = {
        ...formData,
        companyId: formData.companyId || effectiveCompanyId || undefined,
        projectId: formData.projectId || effectiveProjectId || undefined,
      };
      // Strictly remove any tenant fields so Tenant is completely invisible to business operations
      delete payload.tenantId;
      delete payload.TenantId;
      delete payload.tenant_id;
      delete payload.tenant;
      delete payload.tenantCode;

      if (drawerMode === "edit" && editingRecord) {
        const id = editingRecord[idKey] || editingRecord.id;
        const res = await apiClient.put(`${schema.apiEndpoint}/${id}`, payload);
        const successMsg = res.data?.message || `${schema.title} record updated successfully.`;
        notifySuccess(successMsg);
      } else {
        const res = await apiClient.post(schema.apiEndpoint, payload);
        const successMsg = res.data?.message || `New ${schema.title} record created successfully.`;
        notifySuccess(successMsg);
      }
      handleCloseDrawer();
      await fetchData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to save record."));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const idKey = schema.idField || "id";
      const id = deleteTarget[idKey] || deleteTarget.id;
      const res = await apiClient.delete(`${schema.apiEndpoint}/${id}`);
      const successMsg = res.data?.message || "Record deleted successfully.";
      notifySuccess(successMsg);
      setDeleteTarget(null);
      if (drawerMode !== "closed") {
        handleCloseDrawer();
      }
      await fetchData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete record."));
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV / Excel Export with UTF-8 BOM
  const handleExportCsv = async () => {
    // Attempt high-performance server-side export if entity matches backend catalog
    const rawKey = (schema.pageKey || schema.apiEndpoint || "").replace(/^\/?api\/v1\//, "").replace(/\//g, "").toLowerCase();
    const knownExportEntities = [
      "employees", "departments", "chartofaccounts", "purchaseorders",
      "salesorders", "invoices", "customers", "vendors", "items", "leads", "assets", "projects", "auditlogs"
    ];
    const matchedEntity = knownExportEntities.find((k) => rawKey.includes(k));

    if (matchedEntity) {
      try {
        const response = await apiClient.post(
          "/data-export/generate",
          { entityKey: matchedEntity, format: "csv" },
          { responseType: "blob" }
        );
        const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${matchedEntity}_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        notifySuccess(`Exported high-performance ${matchedEntity} dataset from server.`);
        return;
      } catch (err) {
        // Fall back gracefully to client-side export
        console.warn("Server-side export unavailable, falling back to client-side data.", err);
      }
    }

    if (filteredRecords.length === 0) {
      notifyError("No data to export.");
      return;
    }
    const cols = schema.columns.filter((c) => !c.hidden);
    const headers = cols.map((c) => `"${c.label}"`).join(",");
    const rows = filteredRecords.map((rec) =>
      cols.map((c) => `"${String(rec[c.key] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "\uFEFF" + [headers, ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${schema.pageKey || "export"}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notifySuccess("CSV/Excel exported successfully.");
  };

  // Print Tabular List Report
  const handlePrintList = () => {
    const cols = visibleColumns.map((c) => ({ key: c.key, label: c.label }));
    const filterDesc = filterAst
      ? filterAstToHumanReadable(filterAst)
      : Object.entries(quickFilterValues)
          .filter(([_, v]) => v && v !== "all")
          .map(([k, v]) => `${cleanFieldLabel(k)}: ${v}`)
          .join(" | ");

    const activeCompanyName =
      ctxCompanyLegalName || ctxCompanyName || (user as any)?.tenantName || "Enterprise Organization";

    printTabularReport({
      title: `${schema.title || schema.entityName || "Records"} Register`,
      reportNumber: `REG-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`,
      companyName: activeCompanyName,
      companyAddress: ctxCompanyAddress || undefined,
      companyGstin: ctxCompanyGstin || undefined,
      logoUrl: ctxCompanyLogoUrl || undefined,
      brandColor: ctxCompanyBrandColor || undefined,
      accentColor: ctxCompanyAccentColor || undefined,
      columns: cols,
      rows: filteredRecords,
      filterSummary: filterDesc || undefined,
    });
  };

  // Bulk Delete Handler
  const handleBulkDelete = async (selectedRows: any[]) => {
    if (!selectedRows || selectedRows.length === 0) return;
    try {
      setIsActionLoading(true);
      const idKey = schema?.idField || "id";
      for (const item of selectedRows) {
        const id = typeof item === "string" ? item : (item[idKey] || item.id);
        if (id) {
          await apiClient.delete(`${schema.apiEndpoint}/${id}`);
        }
      }
      notifySuccess(`Deleted ${selectedRows.length} record(s).`);
      await fetchData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to delete selected records."));
    } finally {
      setIsActionLoading(false);
    }
  };

  // Export Selected Rows Handler (routes through Universal Multi-Format Export Modal)
  const handleExportSelected = (selectedIds: string[]) => {
    setSelectedExportIds(selectedIds);
    setIsExportModalOpen(true);
  };

  // Generic Page Action Execution Handler
  const handleExecutePageAction = async (actionKey: string, actionType = "custom", targetId?: string, selectedIds?: string[]) => {
    try {
      setIsActionLoading(true);
      const res = await appApi.pageActions.execute({
        pageKey: schema.pageKey || schema.entityName || "generic",
        actionKey,
        actionType,
        entityId: targetId,
        selectedIds: selectedIds,
        parameters: {
          entityType: schema.entityName,
          moduleKey: schema.pageKey?.split(".")[0] || "core",
        }
      });

      if (res.data?.success) {
        notifySuccess(res.data.message || "Action executed successfully.");
        if (res.data.nextAction === "refresh") {
          await fetchData();
        } else if (res.data.nextAction === "navigate" && res.data.redirectUrl) {
          router.push(res.data.redirectUrl);
        }
      } else {
        notifyError(res.data?.message || "Action failed.");
      }
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to execute page action."));
    } finally {
      setIsActionLoading(false);
    }
  };

  if (drawerMode !== "closed") {
    const isEdit = drawerMode === "edit";
    const recordTitle = editingRecord
      ? editingRecord.fullName || editingRecord.name || editingRecord.title || editingRecord.displayName || editingRecord.code || `Record #${String(editingRecord.id || "").slice(0, 8)}`
      : `New ${schema.entityName || "Record"}`;

    const recordCode = editingRecord?.code || editingRecord?.userCode || editingRecord?.employeeCode || (editingRecord?.id ? String(editingRecord.id).slice(0, 8) : "");
    const recordStatus = editingRecord?.status ?? (editingRecord?.isActive === true ? "Active" : editingRecord?.isActive === false ? "Inactive" : "Active");
    const isStatusActive = String(recordStatus).toLowerCase() === "active" || recordStatus === true;

    // Record stepper navigation (< and >)
    const idKey = schema.idField || "id";
    const currentIndex = editingRecord ? filteredRecords.findIndex((r) => String(r[idKey] || r.id) === String(editingRecord[idKey] || editingRecord.id)) : -1;
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex >= 0 && currentIndex < filteredRecords.length - 1;

    const handlePrevRecord = () => {
      if (hasPrev) {
        setEditingRecord(filteredRecords[currentIndex - 1]);
      }
    };

    const handleNextRecord = () => {
      if (hasNext) {
        setEditingRecord(filteredRecords[currentIndex + 1]);
      }
    };

    const handleCloneRecord = () => {
      if (!editingRecord) return;
      const cloned = { ...editingRecord };
      const idKey = schema.idField || "id";
      delete cloned[idKey];
      delete cloned.id;
      delete cloned._id;
      delete cloned.createdAt;
      delete cloned.updatedAt;
      delete cloned.created_at;
      delete cloned.updated_at;
      delete cloned.createdBy;
      delete cloned.updatedBy;
      delete cloned.created_by;
      delete cloned.updated_by;
      delete cloned.rowVersion;

      if (cloned.name) cloned.name = `${cloned.name} (Copy)`;
      if (cloned.title) cloned.title = `${cloned.title} (Copy)`;
      if (cloned.fullName) cloned.fullName = `${cloned.fullName} (Copy)`;
      if (cloned.code) cloned.code = `${cloned.code}-COPY`;

      setEditingRecord(cloned);
      setDrawerMode("create");
      notifySuccess("Record Cloned", "Review cloned fields and click Save to create new record.");
    };

    const handlePrintRecord = () => {
      if (!editingRecord) {
        window.print();
        return;
      }

      const summaryFields: Record<string, any> = {};
      const ignoreFields = new Set([
        "id", "tenantId", "createdAt", "updatedAt", "deletedAt", "isDeleted",
        "items", "lineItems", "passwordHash", "concurrencyStamp"
      ]);

      schema.columns?.forEach((col) => {
        if (!ignoreFields.has(col.key) && editingRecord[col.key] !== undefined && editingRecord[col.key] !== null) {
          summaryFields[col.label || col.key] = String(editingRecord[col.key]);
        }
      });

      const rawItems = Array.isArray(editingRecord.items)
        ? editingRecord.items
        : Array.isArray(editingRecord.lineItems)
        ? editingRecord.lineItems
        : undefined;

      const lineItems = rawItems?.map((it: any) => ({
        description: it.description || it.itemName || it.name || "Item",
        hsnCode: it.hsnCode || it.sacCode,
        quantity: Number(it.quantity || it.qty || 1),
        unitPrice: Number(it.unitPrice || it.rate || it.price || 0),
        taxRate: it.taxRate != null ? Number(it.taxRate) : undefined,
        lineTotal: Number(it.lineTotal || it.amount || it.total || (Number(it.quantity || 1) * Number(it.unitPrice || 0))),
      }));

      const isCompanyEntity =
        schema.entityName?.toLowerCase() === "company" ||
        schema.pageKey === "administration.companies";

      const docCompanyName = isCompanyEntity
        ? (editingRecord.legalName || editingRecord.name || ctxCompanyLegalName || ctxCompanyName || "Enterprise Organization")
        : (ctxCompanyLegalName || ctxCompanyName || (user as any)?.tenantName || "Enterprise Organization");

      const docCompanyAddress = isCompanyEntity
        ? [
            editingRecord.registrationAddress || editingRecord.operationalAddress,
            editingRecord.city,
            [editingRecord.state, editingRecord.postalCode].filter(Boolean).join(" - "),
          ].filter(Boolean).join(", ") || ctxCompanyAddress || undefined
        : ctxCompanyAddress || undefined;

      const docCompanyGstin = isCompanyEntity
        ? (editingRecord.gstin || editingRecord.taxId || ctxCompanyGstin || undefined)
        : (ctxCompanyGstin || undefined);

      const isCommercial = Boolean(
        editingRecord.subTotal ||
        editingRecord.grandTotal ||
        editingRecord.totalAmount ||
        (lineItems && lineItems.length > 0) ||
        schema.moduleKey === "sales" ||
        schema.moduleKey === "procurement" ||
        schema.moduleKey === "accounting"
      );

      const partyLabel = isCommercial
        ? "Issued / Billed To"
        : schema.entityName
        ? `${schema.entityName} Details`
        : "Record Details";

      const partyName = isCommercial
        ? (editingRecord.customerName || editingRecord.vendorName || editingRecord.partyName || editingRecord.clientName)
        : (editingRecord.name || editingRecord.fullName || editingRecord.title);

      const partyAddress = isCommercial
        ? (editingRecord.shippingAddress || editingRecord.billingAddress || editingRecord.address)
        : undefined;

      const partyGstin = isCommercial
        ? (editingRecord.gstin || editingRecord.taxId)
        : undefined;

      const docLogoUrl = isCompanyEntity
        ? (editingRecord.logoUrl || ctxCompanyLogoUrl || undefined)
        : (ctxCompanyLogoUrl || undefined);

      const docBrandColor = isCompanyEntity
        ? (editingRecord.brandColor || ctxCompanyBrandColor || undefined)
        : (ctxCompanyBrandColor || undefined);

      const docAccentColor = isCompanyEntity
        ? (editingRecord.accentColor || ctxCompanyAccentColor || undefined)
        : (ctxCompanyAccentColor || undefined);

      const docHeaderLayout = isCompanyEntity
        ? (editingRecord.letterheadLayout || ctxCompanyLetterheadLayout || undefined)
        : (ctxCompanyLetterheadLayout || undefined);

      printRecordDocument({
        title: schema.title || schema.entityName || "Official Document",
        documentNumber: String(recordCode || editingRecord.orderNumber || editingRecord.invoiceNumber || editingRecord.id || ""),
        date: editingRecord.orderDate || editingRecord.invoiceDate || editingRecord.joiningDate || editingRecord.date || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        watermarkText: editingRecord.status === "Draft" || editingRecord.status === "Pending" ? String(editingRecord.status).toUpperCase() : undefined,
        companyName: docCompanyName,
        companyAddress: docCompanyAddress,
        companyGstin: docCompanyGstin,
        logoUrl: docLogoUrl,
        brandColor: docBrandColor,
        accentColor: docAccentColor,
        headerLayout: docHeaderLayout,
        projectName: ctxProjectName || undefined,
        projectSiteAddress: ctxProjectSiteAddress || undefined,
        projectClientLogoUrl: ctxProjectClientLogoUrl || undefined,
        projectSignatoryName: ctxProjectSignatoryName || undefined,
        projectSignatoryTitle: ctxProjectSignatoryTitle || undefined,
        partyLabel,
        partyName: partyName || undefined,
        partyAddress,
        partyGstin,
        summaryFields: Object.keys(summaryFields).length > 0 ? summaryFields : undefined,
        lineItems,
        subTotal: editingRecord.subTotal ? Number(editingRecord.subTotal) : undefined,
        taxAmount: editingRecord.taxAmount ? Number(editingRecord.taxAmount) : undefined,
        grandTotal: editingRecord.grandTotal || editingRecord.totalAmount ? Number(editingRecord.grandTotal || editingRecord.totalAmount) : undefined,
        notes: editingRecord.notes || editingRecord.termsAndConditions || editingRecord.remarks,
        includeSignatureBlock: isCommercial,
      });
    };

    const formSections =
      schema.form?.sections && schema.form.sections.length > 0
        ? schema.form.sections
        : [
            {
              title: `${schema.entityName || "Record"} Information`,
              description: `Fill out all essential fields for this ${schema.entityName?.toLowerCase() || "item"}.`,
              fields: (schema.columns || [])
                .filter((c) => c.key !== "actions" && c.key !== "id" && !BLACKLISTED_TECHNICAL_KEYS.has(c.key.toLowerCase()))
                .map((c) => ({
                  key: c.key,
                  label: cleanFieldLabel(c.label),
                  fieldType: (c.dataType === "number" || c.dataType === "currency"
                    ? "number"
                    : c.dataType === "date" || c.dataType === "datetime"
                    ? "date"
                    : c.dataType === "boolean"
                    ? "boolean"
                    : "text") as any,
                  required: c.sortable !== false,
                  placeholder: c.dataType === "boolean" ? undefined : `Enter ${cleanFieldLabel(c.label).toLowerCase()}…`,
                })),
            },
          ];

    return (
      <>
        <div className="w-full bg-slate-50/60 p-3 sm:p-5 lg:p-6 dark:bg-slate-950/40">
        <div className="w-full space-y-6">

          {/* Frappe Document Header Banner */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerMode("closed")}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                title="Back to list"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {recordTitle}
                  </h1>
                  {isEdit && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border shadow-2xs",
                        isStatusActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", isStatusActive ? "bg-emerald-500" : "bg-slate-400")} />
                      {String(recordStatus)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {schema.entityName || "Record"} &middot; {isEdit ? "Update and manage record attributes" : "Create and register a new record"}
                </p>
              </div>
            </div>

            {/* Top Right Action Cluster */}
            <div className="flex items-center gap-2">
              {isEdit && editingRecord && (
                <div className="flex items-center gap-1.5 mr-1">
                  <button
                    type="button"
                    onClick={handleCloneRecord}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Clone Record"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Clone</span>
                  </button>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(editingRecord)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
                      title="Delete Record"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handlePrintRecord}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
                title="Print document"
              >
                <Printer className="h-4 w-4" />
              </button>

              {isEdit && filteredRecords.length > 1 && (
                <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs overflow-hidden">
                  <button
                    type="button"
                    onClick={handlePrevRecord}
                    disabled={!hasPrev}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors border-r border-slate-200 dark:border-slate-700 cursor-pointer"
                    title="Previous record"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextRecord}
                    disabled={!hasNext}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors cursor-pointer"
                    title="Next record"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleCloseDrawer}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="dynamic-record-form"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>{isEdit ? "Update" : "Save"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tabbed Document Form */}
          <div>
            <DynamicForm
              sections={formSections}
              initialData={editingRecord}
              isEdit={isEdit}
              isSaving={isSaving}
              onCancel={handleCloseDrawer}
              onSubmit={handleSaveForm}
              workflow={schema.workflowConfig || schema.workflow}
              hasAttachments={Boolean(schema.hasAttachments)}
              hasTimeline={Boolean(schema.hasTimeline)}
              formId="dynamic-record-form"
              onWorkflowTransition={async (transition, remarks) => {
                if (!editingRecord?.id) return;
                const stateField = (schema.workflowConfig || schema.workflow)?.stateField || "status";
                try {
                  await apiClient.post(`/workflows/transition`, {
                    entityType: schema.entityName || schema.pageKey,
                    entityId: editingRecord.id,
                    action: transition.action,
                    fromState: transition.fromState,
                    toState: transition.toState,
                    remarks,
                    stateField,
                  });
                  notifySuccess("Workflow Transitioned", `Status changed to ${transition.toState}`);
                  setEditingRecord((prev: any) => prev ? { ...prev, [stateField]: transition.toState } : null);
                  void fetchData();
                } catch {
                  // Fallback: update status field directly on the record
                  try {
                    await apiClient.put(`${schema.apiEndpoint}/${editingRecord.id}`, {
                      ...editingRecord,
                      [stateField]: transition.toState,
                    });
                    notifySuccess("Status Updated", `Record moved to ${transition.toState}`);
                    setEditingRecord((prev: any) => prev ? { ...prev, [stateField]: transition.toState } : null);
                    void fetchData();
                  } catch (updateErr) {
                    notifyError(getApiErrorMessage(updateErr, "Workflow transition failed."));
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
      <UniversalDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${schema.entityName || "Record"}`}
        entityName={deleteTarget?.fullName || deleteTarget?.name || deleteTarget?.code || "Record"}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </>
    );
  }

  return (
    <>

      <div className="w-full min-w-0 space-y-4">
        {/* Frappe-Style Action & Filter Toolbar */}
        <ErpFrappeListToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onRefresh={() => void fetchData()}
          isRefreshing={loadingData}
          onImport={() => setIsImportModalOpen(true)}
          onExportCsv={() => {
            setSelectedExportIds([]);
            setIsExportModalOpen(true);
          }}
          onPrintList={handlePrintList}
          density={density}
          onDensityChange={(d) => setDensityInStore(pageKey, d)}
          onCustomize={() => setIsCustomizationOpen(true)}
          onToggleSidebar={() => {
            if (typeof window !== "undefined") {
              const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
              window.dispatchEvent(event);
            }
          }}
          primaryActionLabel={canCreate ? `+ Add ${schema.entityName || "Record"}` : undefined}
          onPrimaryAction={
            canCreate
              ? () => {
                  setEditingRecord(null);
                  setDrawerMode("create");
                }
              : undefined
          }
          columns={schema.columns || []}
          quickFilterFields={quickFilterFields}
          quickFilterValues={quickFilterValues}
          onQuickFilterChange={(k, v) => {
            setQuickFilterValues((prev) => ({ ...prev, [k]: v }));
            setCurrentPage(1);
          }}
          onClearQuickFilters={() => {
            setQuickFilterValues({});
            setCurrentPage(1);
          }}
          advancedFilters={advancedFilters}
          onApplyAdvancedFilters={(filters) => {
            setAdvancedFilters(filters);
            setCurrentPage(1);
          }}
          onClearAdvancedFilters={() => {
            setAdvancedFilters([]);
            setFilterAst(null);
            setCurrentPage(1);
          }}
          filterAst={filterAst}
          onApplyFilterAst={(ast) => {
            setFilterAst(ast);
            setCurrentPage(1);
          }}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSortChange={(k, d) => {
            setSortKey(k);
            setSortDirection(d);
          }}
          savedViews={pageCustomization?.savedViews || []}
          activeViewId={pageCustomization?.activeViewId || null}
          onSelectView={(viewId) => {
            if (viewId === "default") {
              setQuickFilterValues({});
              setAdvancedFilters([]);
              setSortKey(schema.idField || "id");
              setSortDirection("desc");
              activateView(pageKey, "default");
            } else {
              activateView(pageKey, viewId);
              const activated = pageCustomization?.savedViews.find((v) => v.id === viewId);
              if (activated) {
                if (activated.filters) {
                  setQuickFilterValues(activated.filters);
                }
                if (activated.sortKey) {
                  setSortKey(activated.sortKey);
                  setSortDirection(activated.sortDir || "asc");
                }
              }
            }
          }}
          onSaveCurrentView={(name, scope) => {
            setActiveFiltersInStore(pageKey, { ...quickFilterValues });
            setSortInStore(pageKey, sortKey, sortDirection);
            void saveView(pageKey, name, scope);
            notifySuccess("View Saved", `"${name}" saved to your views.`);
          }}
          onDeleteView={(viewId) => {
            deleteView(pageKey, viewId);
            notifySuccess("View Deleted", "Saved view removed.");
          }}
        />

        {/* ── View Switcher Modes ── */}
        {viewMode === "kanban" && (
          <DynamicKanbanView
            rows={filteredRecords}
            columns={schema.columns || []}
            onEdit={(row) => {
              if (canEdit) {
                setEditingRecord(row);
                setDrawerMode("edit");
              }
            }}
            onDelete={canDelete ? (row) => setDeleteTarget(row) : undefined}
            onCreateInLane={
              canCreate
                ? (status) => {
                    setEditingRecord({ status });
                    setDrawerMode("create");
                  }
                : undefined
            }
            idField={schema.idField || "id"}
          />
        )}

        {viewMode === "image" && (
          <ErpCardGridView
            rows={filteredRecords}
            titleKey={visibleColumns[0]?.key || "name"}
            idField={schema.idField || "id"}
            onEdit={(row) => {
              if (canEdit) {
                setEditingRecord(row);
                setDrawerMode("edit");
              }
            }}
            onDelete={canDelete ? (row) => setDeleteTarget(row) : undefined}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onOpenComments={(row) => setActiveTimelineRecord(row)}
            getRelativeTime={getRelativeTime}
          />
        )}

        {viewMode === "report" && (
          <ErpReportView
            rows={filteredRecords}
            columns={schema.columns || []}
            onExportCsv={() => {
              setSelectedExportIds([]);
              setIsExportModalOpen(true);
            }}
            title={schema.title}
          />
        )}

        {viewMode === "list" && (
          <ErpFrappeTableView
            rows={serverTotalRecords !== null ? records : filteredRecords}
            columns={visibleColumns}
            density={density}
            idField={schema.idField || "id"}
            onEdit={
              canEdit
                ? (row) => {
                    setEditingRecord(row);
                    setDrawerMode("edit");
                  }
                : undefined
            }
            onDelete={canDelete ? (row) => setDeleteTarget(row) : undefined}
            onBulkDelete={canDelete ? handleBulkDelete : undefined}
            onExportSelected={(ids) => {
              setSelectedExportIds(ids);
              setIsExportModalOpen(true);
            }}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onOpenComments={(row) => setActiveTimelineRecord(row)}
            getRelativeTime={getRelativeTime}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSortChange={(k, d) => {
              setSortKey(k);
              setSortDirection(d);
            }}
            renderCell={(col, val, row) => renderDynamicTableCell(col, val, row)}
            isLoading={loadingData}
            emptyMessage={`No ${schema.title} found. Click '+ Add ${schema.entityName || "Record"}' to create one.`}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            totalRecords={serverTotalRecords ?? filteredRecords.length}
          />
        )}
      </div>

      {/* Record Activity / Comments Slide Drawer */}
      {activeTimelineRecord && (
        <SideDrawer
          open={Boolean(activeTimelineRecord)}
          onClose={() => setActiveTimelineRecord(null)}
          title="Activity & Comments"
          subtitle={String(activeTimelineRecord.fullName || activeTimelineRecord.name || activeTimelineRecord.title || "Record")}
          width="md"
        >
          <DynamicRecordTimeline
            recordTitle={String(activeTimelineRecord.fullName || activeTimelineRecord.name || "Record")}
            entries={[
              {
                id: "init-1",
                type: "creation",
                author: "System Administrator",
                message: `Record was created and verified in corporate directory.`,
                timestamp: activeTimelineRecord.createdAt || "Recently",
              },
              ...(activeTimelineRecord.comments || []),
            ]}
            onAddComment={async (text) => {
              notifySuccess("Comment added.");
              setActiveTimelineRecord((prev: any) =>
                prev
                  ? {
                      ...prev,
                      commentCount: (prev.commentCount || 0) + 1,
                      comments: [
                        ...(prev.comments || []),
                        {
                          id: String(Date.now()),
                          type: "comment",
                          author: "You",
                          message: text,
                          timestamp: "Just now",
                        },
                      ],
                    }
                  : null
              );
            }}
          />
        </SideDrawer>
      )}

      <UniversalDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${schema.entityName}`}
        entityName={deleteTarget?.fullName || deleteTarget?.name || deleteTarget?.code || "Record"}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />

      <UniversalBulkImportModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        entityName={schema.entityName || "Record"}
        apiEndpoint={schema.apiEndpoint}
        fields={schema.columns.map((c) => ({
          key: c.key,
          label: c.label,
          required: schema.form?.sections?.some((s) => s.fields?.some((f) => f.key === c.key && f.required)),
        }))}
        onImportComplete={() => void fetchData()}
      />

      <PageCustomizationModal
        open={isCustomizationOpen}
        onOpenChange={setIsCustomizationOpen}
        pageKey={pageKey}
        columns={schema.columns || []}
        hiddenColumnKeys={hiddenColumnKeys}
        onToggleColumn={(key) => {
          setHiddenColumnKeys((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
          );
        }}
        onResetColumns={() => setHiddenColumnKeys([])}
        density={density}
        onDensityChange={(d) => setDensityInStore(pageKey, d)}
        isSuperAdmin={isSuperAdmin}
      />

      <UniversalExportModal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
        entityName={schema.entityName || schema.title || "Record"}
        pageKey={schema.pageKey || pageKey}
        columns={schema.columns || []}
        filteredRecords={filteredRecords}
        allRecords={records}
        selectedIds={selectedExportIds}
        idField={schema.idField || "id"}
      />
    </>
  );
}
