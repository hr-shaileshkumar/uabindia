"use client";

import React, { useState } from "react";
import { Palette, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformGlobalPageShell, KpiMetricItem } from "@/components/platform/PlatformGlobalPageShell";
import { notifySuccess } from "@/lib/notifications";

interface ThemeRow {
  id: string;
  name: string;
  primaryColor: string;
  fontFamily: string;
  isActive: boolean;
}

const SEED_THEMES: ThemeRow[] = [
  { id: "thm_1", name: "Enterprise Indigo (Default Dark Mode)", primaryColor: "#4f46e5", fontFamily: "Inter, sans-serif", isActive: true },
  { id: "thm_2", name: "Slate Corporate Minimal", primaryColor: "#0f172a", fontFamily: "Roboto, sans-serif", isActive: false },
  { id: "thm_3", name: "Emerald BioTech Fresh", primaryColor: "#10b981", fontFamily: "Outfit, sans-serif", isActive: false },
];

export default function WebsiteThemesPage() {
  const [themes, setThemes] = useState<ThemeRow[]>(SEED_THEMES);

  const handleActivateTheme = (id: string) => {
    setThemes((prev) =>
      prev.map((t) => ({ ...t, isActive: t.id === id }))
    );
    notifySuccess("Portal theme activated.");
  };

  const kpis: KpiMetricItem[] = [
    { label: "Active Theme", value: "Enterprise Indigo", tone: "positive", icon: <Palette className="h-3.5 w-3.5" />, subtext: "Active Token" },
    { label: "Design System", value: "CSS Variables", tone: "info", icon: <Sparkles className="h-3.5 w-3.5" />, subtext: "Tailwind V4" },
    { label: "Dark Mode", value: "Supported", tone: "positive", icon: <ShieldCheck className="h-3.5 w-3.5" />, subtext: "Automatic" },
    { label: "Font Family", value: "Inter", tone: "warning", icon: <Palette className="h-3.5 w-3.5" />, subtext: "Google Fonts" },
  ];

  return (
    <PlatformGlobalPageShell
      title="Portal Themes & Design Tokens"
      subtitle="Customize global CSS variables, color palettes, typography tokens, and active portal themes."
      categoryTag="Website CMS Engine"
      kpiMetrics={kpis}
    >
      <div className="p-6 grid gap-6 md:grid-cols-3">
        {themes.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl border p-5 space-y-4 shadow-xs transition-all ${
              t.isActive ? "border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{t.name}</span>
              {t.isActive ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Active</Badge>
              ) : null}
            </div>

            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Primary Color:</span>
                <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: t.primaryColor }} />
                <span className="font-mono text-slate-700 dark:text-slate-300">{t.primaryColor}</span>
              </div>
              <div>
                <span>Font Family: </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{t.fontFamily}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              {!t.isActive ? (
                <Button size="sm" variant="outline" onClick={() => handleActivateTheme(t.id)}>
                  Activate Theme
                </Button>
              ) : (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Active Portal Theme
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </PlatformGlobalPageShell>
  );
}
