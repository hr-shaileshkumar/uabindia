"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  Sparkles,
  Layout,
  Table,
  Plus,
  Loader2,
  AlertCircle,
  ExternalLink,
  Shield,
  ArrowRight,
  Database,
} from "lucide-react";
import { UniversalPageDispatcher } from "@/components/dynamic/UniversalPageDispatcher";
import { useUiSchema } from "@/context/UiSchemaContext";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/services/apiClient";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { cn } from "@/lib/utils";

export default function DynamicWorkspaceCatchAllPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isSuperAdmin } = useAuth();
  const { getPageSchema } = useUiSchema();

  const [loading, setLoading] = useState(true);
  const [schema, setSchema] = useState<any | null>(null);
  const [pageMetadata, setPageMetadata] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Normalize slug into moduleKey and pageKey
  const { moduleKey, pageKey, rawSlug } = useMemo(() => {
    const raw = params?.slug;
    const slugArray = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
    if (slugArray.length === 0) {
      return { moduleKey: "platform", pageKey: "platform.dashboard", rawSlug: "" };
    }
    const mod = slugArray[0].toLowerCase();
    const page = slugArray.length > 1
      ? `${mod}.${slugArray.slice(1).join(".")}`
      : `${mod}.dashboard`;
    return {
      moduleKey: mod,
      pageKey: page,
      rawSlug: slugArray.join("/"),
    };
  }, [params]);

  const isAdmin = useMemo(() => {
    if (isSuperAdmin || user?.isSystemAdmin) return true;
    const roles = (user?.roles || (user?.role ? [user.role] : [])) as string[];
    return roles.some((r) => r.toLowerCase().includes("admin"));
  }, [isSuperAdmin, user]);

  useEffect(() => {
    let active = true;

    async function loadDynamicSchema() {
      if (!pageKey) return;
      try {
        setLoading(true);
        setError(null);

        // 1. First attempt via UiSchemaContext / ui-shell
        let resolvedSchema = null;
        try {
          resolvedSchema = await getPageSchema(pageKey);
        } catch {
          resolvedSchema = null;
        }

        // 2. Second attempt via direct /api/v1/ui-pages/{pageKey}
        if (!resolvedSchema) {
          try {
            const res = await apiClient.get<any>(`/ui-pages/pages/${encodeURIComponent(pageKey)}`);
            if (res.data) {
              setPageMetadata(res.data);
              if (res.data.schemaJson) {
                try {
                  resolvedSchema = JSON.parse(res.data.schemaJson);
                } catch {
                  resolvedSchema = res.data.schemaJson;
                }
              }
            }
          } catch {
            // Not found in DB yet
          }
        }

        if (active) {
          setSchema(resolvedSchema);
        }
      } catch (err: any) {
        if (active) {
          setError(err?.message || "Failed to load page schema.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDynamicSchema();

    return () => {
      active = false;
    };
  }, [pageKey, getPageSchema]);

  // Loading Skeleton
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
          </div>
          <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-800" />
          ))}
        </div>
        <div className="h-80 bg-slate-100 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800" />
      </div>
    );
  }

  // If Schema is Published: Render live via UniversalPageDispatcher!
  if (schema) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <UniversalPageDispatcher pageKey={pageKey} schema={schema} />
      </div>
    );
  }

  // Schema Not Published Yet: Onboarding Scaffold for Zero-Code Custom Pages
  return (
    <div className="p-6 max-w-4xl mx-auto my-12">
      <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 p-8 sm:p-12 text-center backdrop-blur-xs shadow-xs">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg mb-6">
          <Sparkles size={28} />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800 mb-3">
          <Layers size={13} />
          Dynamic Zero-Code Page &bull; {moduleKey.toUpperCase()}
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {pageMetadata?.title || `${rawSlug.replace(/\//g, " / ").toUpperCase()}`}
        </h1>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          This page route (<code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-blue-600 dark:text-blue-400">/workspace/{rawSlug}</code>) has been dynamically registered for key <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md text-slate-700 dark:text-slate-300">{pageKey}</code>.
        </p>

        {isAdmin ? (
          <div className="mt-8 space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900 text-left text-xs text-amber-900 dark:text-amber-200 max-w-md mx-auto space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <Shield size={14} /> Administrator Action Required
              </div>
              <p>
                No UI Schema has been published for this page key yet. You can design columns, forms, cards, and workflows with zero coding.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href={`/administration/page-builder?pageKey=${encodeURIComponent(pageKey)}&moduleKey=${encodeURIComponent(moduleKey)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all hover:scale-105"
              >
                <Layout size={15} />
                Open in No-Code Page Builder
                <ArrowRight size={14} />
              </Link>

              <Link
                href="/administration/module-mapping"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
              >
                <Database size={14} />
                Manage Hierarchy
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 max-w-md mx-auto">
            This module view is currently being configured by your Organization Administrator. Please check back shortly.
          </div>
        )}
      </div>
    </div>
  );
}

