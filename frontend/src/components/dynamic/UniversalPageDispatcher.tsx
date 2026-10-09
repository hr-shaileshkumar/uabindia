"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  Sparkles,
  LayoutGrid,
  FileSpreadsheet,
  Calendar,
  Kanban,
  FileText,
  SlidersHorizontal,
  ArrowRight,
  ExternalLink,
  Plus,
} from "lucide-react";
import { DynamicPage, pageSchemaToDynamicSchema } from "@/components/dynamic/DynamicPage";
import { UabModuleDashboard } from "@/components/dynamic/UabModuleDashboard";
import { MetadataDashboardStudio } from "@/features/dashboard/components/MetadataDashboardStudio";
import {
  UabDocumentStatusActions,
  UabLineGrid,
  UabMasterSelect,
  UabTotalsStrip,
  PrintButton,
} from "@/components/uab/document-builder";
import { getCatalogSchema, masterSchemaCatalog } from "@/lib/metadata/catalog";
import { FRONTEND_MODULE_MAP } from "@/lib/workspace/frontend-module-map";
import type { PageSchema, PageArchetype } from "@/lib/metadata/types";
import type { DynamicPageSchema } from "@/lib/dynamic-schema/types";
import { cn } from "@/lib/utils";

export interface UniversalPageDispatcherProps {
  pageKey: string;
  schema?: PageSchema | DynamicPageSchema;
  archetypeOverride?: PageArchetype;
  className?: string;
}

/**
 * UniversalPageDispatcher — UAB India Centralized Page Archetype Engine
 *
 * Automatically inspects the page metadata and renders the exact archetype requested:
 *  - "dashboard": Module/Submodule Hub (KPIs, launchpad, activity feeds)
 *  - "master":    Transactional Register & Catalog (Data table, filter AST, drawer CRUD)
 *  - "document":  Commercial Voucher (Line items grid, GST taxes, totals, posting)
 *  - "kanban":    State Progression Pipeline (Draggable deal/stage cards)
 *  - "calendar":  Roster & Scheduler (Monthly/weekly event grid)
 *  - "studio":    Executive Command Studio (Draggable telemetry widgets)
 */
export function UniversalPageDispatcher({
  pageKey,
  schema: providedSchema,
  archetypeOverride,
  className,
}: UniversalPageDispatcherProps) {
  // 1. Resolve Catalog Schema
  const resolvedCatalogSchema = useMemo(() => {
    if (providedSchema) {
      if ("viewType" in providedSchema && typeof providedSchema.viewType === "string") {
        return providedSchema as PageSchema;
      }
    }
    return getCatalogSchema(pageKey);
  }, [pageKey, providedSchema]);

  // 2. Resolve Module Meta from frontend-module-map (if applicable)
  const moduleMeta = useMemo(() => {
    const rootKey = pageKey.split(".")[0];
    return FRONTEND_MODULE_MAP.find(
      (m) => m.key.toLowerCase() === rootKey.toLowerCase()
    );
  }, [pageKey]);

  // 3. Determine Page Archetype
  const effectiveArchetype: PageArchetype = useMemo(() => {
    if (archetypeOverride) return archetypeOverride;

    const s = resolvedCatalogSchema;
    if (s?.archetype) return s.archetype;

    // Detect from pageKey or schema viewType/pageType
    const normalizedKey = pageKey.toLowerCase();
    if (
      normalizedKey.endsWith(".dashboard") ||
      normalizedKey === "dashboard" ||
      s?.viewType === "dashboard" ||
      s?.pageType === "dashboard"
    ) {
      return "dashboard";
    }

    if (
      s?.pageType === "document" ||
      normalizedKey.endsWith(".voucher") ||
      normalizedKey.endsWith(".vouchers") ||
      normalizedKey.endsWith(".document") ||
      normalizedKey.endsWith(".documents") ||
      normalizedKey.endsWith(".invoice") ||
      normalizedKey.endsWith(".invoices") ||
      normalizedKey.endsWith(".order") ||
      normalizedKey.endsWith(".orders") ||
      normalizedKey.endsWith(".expenses") ||
      normalizedKey.endsWith(".journal-entries")
    ) {
      // Check if schema has document-like line item sections
      const hasLines = s?.form?.sections?.some(
        (sec) =>
          sec.key.toLowerCase().includes("line") ||
          sec.key.toLowerCase().includes("item")
      );
      if (
        hasLines ||
        s?.pageType === "document" ||
        normalizedKey.endsWith(".invoice") ||
        normalizedKey.endsWith(".invoices") ||
        normalizedKey.endsWith(".journal-entries")
      ) {
        return "document";
      }
    }

    if (s?.viewType === "kanban" || s?.pageType === "kanban") return "kanban";
    if (s?.viewType === "calendar" || s?.pageType === "calendar") return "calendar";
    if ((s?.pageType as string) === "studio" || s?.viewType === "split") return "studio";

    // Default to Master register
    return "master";
  }, [archetypeOverride, resolvedCatalogSchema, pageKey]);

  // ─────────────────────────────────────────────────────────────────────────────
  // ARCHETYPE 1: DASHBOARD HUB
  // ─────────────────────────────────────────────────────────────────────────────
  if (effectiveArchetype === "dashboard") {
    // Auto-synthesize links from module map if none explicitly provided
    const synthesizedLinks =
      moduleMeta?.submodules?.flatMap((sub) =>
        sub.pages.map((p) => ({
          href: p.route,
          label: p.label,
          icon: LayoutGrid,
          desc: p.purpose,
        }))
      ) || [];

    const defaultKpis = resolvedCatalogSchema?.kpis?.map((k) => ({
      label: k.label,
      value: k.value ?? "—",
      subtext: k.subtext,
    })) || [
      { label: "Active Records", value: 124, trend: 8 },
      { label: "Pending Approvals", value: 7, tone: "warning" as const },
      { label: "Monthly Volume", value: "₹48.2 Lakhs", tone: "positive" as const, trend: 14 },
      { label: "Data Quality Score", value: "99.4%", tone: "info" as const },
    ];

    return (
      <div className={cn("w-full", className)} data-testid="archetype-dashboard">
        <UabModuleDashboard
          moduleKey={resolvedCatalogSchema?.moduleKey || moduleMeta?.key || pageKey}
          title={resolvedCatalogSchema?.title || moduleMeta?.label || "Workspace Dashboard"}
          subtitle={
            resolvedCatalogSchema?.subTitle ||
            moduleMeta?.purpose ||
            "Operational overview, quick navigation, and domain telemetry."
          }
          eyebrow={moduleMeta?.label?.toUpperCase() || "UAB INDIA"}
          kpis={defaultKpis}
          links={synthesizedLinks}
          linksTitle="Submodules & Registers"
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ARCHETYPE 2: EXECUTIVE COMMAND STUDIO
  // ─────────────────────────────────────────────────────────────────────────────
  if (effectiveArchetype === "studio") {
    return (
      <div className={cn("w-full p-4 sm:p-6", className)} data-testid="archetype-studio">
        <MetadataDashboardStudio dashboardKey={pageKey} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ARCHETYPE 3: COMMERCIAL DOCUMENT BUILDER
  // ─────────────────────────────────────────────────────────────────────────────
  if (effectiveArchetype === "document") {
    return (
      <div className={cn("w-full", className)} data-testid="archetype-document">
        <DynamicPage
          pageKey={pageKey}
          initialSchema={resolvedCatalogSchema ? pageSchemaToDynamicSchema(resolvedCatalogSchema) : undefined}
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ARCHETYPE 4 & 5: KANBAN & CALENDAR (Handled smoothly by DynamicPage)
  // ─────────────────────────────────────────────────────────────────────────────
  if (effectiveArchetype === "kanban" || effectiveArchetype === "calendar") {
    return (
      <div className={cn("w-full", className)} data-testid={`archetype-${effectiveArchetype}`}>
        <DynamicPage
          pageKey={pageKey}
          initialSchema={
            resolvedCatalogSchema
              ? {
                  ...pageSchemaToDynamicSchema(resolvedCatalogSchema),
                  viewType: effectiveArchetype === "kanban" ? "kanban" : "calendar",
                }
              : undefined
          }
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ARCHETYPE 6: STANDARD MASTER / TRANSACTION REGISTER (DEFAULT)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className={cn("w-full", className)} data-testid="archetype-master">
      <DynamicPage
        pageKey={pageKey}
        initialSchema={resolvedCatalogSchema ? pageSchemaToDynamicSchema(resolvedCatalogSchema) : undefined}
      />
    </div>
  );
}

export default UniversalPageDispatcher;
