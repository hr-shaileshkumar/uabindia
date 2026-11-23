import type { CSSProperties } from "react";

export type BrandingColorMode = "single" | "gradient" | "multi";

export type BrandingTheme = {
  // Single or primary color
  primaryColor?: string;
  primaryHoverColor?: string;

  // Secondary & Accent for multi-color mix
  secondaryColor?: string;
  accentColor?: string;
  accentSoftColor?: string;

  // Color mode & gradient configuration
  colorMode?: BrandingColorMode;
  gradient?: string;
  gradientAngle?: string;

  // Pre-configured brand preset (e.g. "emerald", "aurora", "sunset", "ocean", "violet", "teal")
  preset?: string;

  // Surface & text styling
  surfaceColor?: string;
  surfaceMutedColor?: string;
  canvasColor?: string;
  foregroundColor?: string;
  textColor?: string;
  backgroundColor?: string;
  legalTextColor?: string;
  glowColor?: string;
};

export type BrandPresetDefinition = {
  name: string;
  mode: BrandingColorMode;
  primaryColor: string;
  primaryHoverColor: string;
  secondaryColor?: string;
  accentColor?: string;
  accentSoftColor?: string;
  gradient?: string;
};

/**
 * Enterprise Brand Presets:
 * Supports Single Color (solid) and Multiple Mix Colors (gradients).
 */
export const BRAND_PRESETS: Record<string, BrandPresetDefinition> = {
  // ── SINGLE COLOR PRESETS ──
  emerald: {
    name: "Emerald Green (Healthcare / Life Sciences)",
    mode: "single",
    primaryColor: "#059669",
    primaryHoverColor: "#047857",
    accentColor: "#10b981",
    accentSoftColor: "rgba(5, 150, 105, 0.12)",
  },
  teal: {
    name: "Clinical Teal (Pharma / Diagnostic)",
    mode: "single",
    primaryColor: "#0d9488",
    primaryHoverColor: "#0f766e",
    accentColor: "#14b8a6",
    accentSoftColor: "rgba(13, 148, 136, 0.12)",
  },
  sapphire: {
    name: "Sapphire Blue (Corporate / Enterprise IT)",
    mode: "single",
    primaryColor: "#2563eb",
    primaryHoverColor: "#1d4ed8",
    accentColor: "#3b82f6",
    accentSoftColor: "rgba(37, 99, 235, 0.12)",
  },
  violet: {
    name: "Imperial Violet (Creative / Modern Tech)",
    mode: "single",
    primaryColor: "#7c3aed",
    primaryHoverColor: "#6d28d9",
    accentColor: "#8b5cf6",
    accentSoftColor: "rgba(124, 58, 237, 0.12)",
  },
  crimson: {
    name: "Ruby Crimson (Finance / Security)",
    mode: "single",
    primaryColor: "#dc2626",
    primaryHoverColor: "#b91c1c",
    accentColor: "#ef4444",
    accentSoftColor: "rgba(220, 38, 38, 0.12)",
  },
  amber: {
    name: "Industrial Amber (Supply Chain / Logistics)",
    mode: "single",
    primaryColor: "#d97706",
    primaryHoverColor: "#b45309",
    accentColor: "#f59e0b",
    accentSoftColor: "rgba(217, 119, 6, 0.12)",
  },

  // ── MULTIPLE MIX COLORS / GRADIENT PRESETS ──
  aurora: {
    name: "Aurora Borealis (Emerald to Cyan Mix)",
    mode: "gradient",
    primaryColor: "#059669",
    primaryHoverColor: "#047857",
    secondaryColor: "#06b6d4",
    accentColor: "#10b981",
    accentSoftColor: "rgba(5, 150, 105, 0.15)",
    gradient: "linear-gradient(135deg, #059669 0%, #06b6d4 100%)",
  },
  sunset: {
    name: "Radiant Sunset (Rose to Amber Mix)",
    mode: "gradient",
    primaryColor: "#e11d48",
    primaryHoverColor: "#be123c",
    secondaryColor: "#f59e0b",
    accentColor: "#fb7185",
    accentSoftColor: "rgba(225, 29, 72, 0.15)",
    gradient: "linear-gradient(135deg, #e11d48 0%, #f59e0b 100%)",
  },
  ocean: {
    name: "Deep Ocean (Navy to Cyan Mix)",
    mode: "gradient",
    primaryColor: "#1e40af",
    primaryHoverColor: "#1e3a8a",
    secondaryColor: "#0d9488",
    accentColor: "#0284c7",
    accentSoftColor: "rgba(30, 64, 175, 0.15)",
    gradient: "linear-gradient(135deg, #1e40af 0%, #0d9488 100%)",
  },
  cosmic: {
    name: "Cosmic Indigo (Violet to Electric Blue Mix)",
    mode: "gradient",
    primaryColor: "#7c3aed",
    primaryHoverColor: "#6d28d9",
    secondaryColor: "#2563eb",
    accentColor: "#a855f7",
    accentSoftColor: "rgba(124, 58, 237, 0.15)",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
  },
  neon: {
    name: "Neon Horizon (Indigo to Hot Pink Mix)",
    mode: "gradient",
    primaryColor: "#4f46e5",
    primaryHoverColor: "#4338ca",
    secondaryColor: "#ec4899",
    accentColor: "#818cf8",
    accentSoftColor: "rgba(79, 70, 229, 0.15)",
    gradient: "linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)",
  },
};

/**
 * Parses raw JSON payload into a structured BrandingTheme.
 */
export const parseBrandingTheme = (payload?: string | null): BrandingTheme => {
  if (!payload) return {};
  try {
    const parsed = JSON.parse(payload) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const theme = parsed as BrandingTheme;

    // Apply preset if specified
    const preset = theme.preset ? BRAND_PRESETS[theme.preset.toLowerCase()] : undefined;

    return {
      primaryColor: theme.primaryColor || preset?.primaryColor,
      primaryHoverColor: theme.primaryHoverColor || preset?.primaryHoverColor,
      secondaryColor: theme.secondaryColor || preset?.secondaryColor,
      accentColor: theme.accentColor || preset?.accentColor,
      accentSoftColor: theme.accentSoftColor || preset?.accentSoftColor,
      colorMode: theme.colorMode || (preset?.mode ?? (theme.secondaryColor || theme.gradient ? "gradient" : "single")),
      gradient: theme.gradient || preset?.gradient,
      gradientAngle: theme.gradientAngle || "135deg",
      preset: theme.preset,
      surfaceColor: theme.surfaceColor,
      surfaceMutedColor: theme.surfaceMutedColor,
      canvasColor: theme.canvasColor,
      foregroundColor: theme.foregroundColor,
      textColor: theme.textColor,
      backgroundColor: theme.backgroundColor,
      legalTextColor: theme.legalTextColor,
      glowColor: theme.glowColor,
    };
  } catch {
    return {};
  }
};

/**
 * Converts a BrandingTheme into comprehensive CSS custom properties.
 * Handles both Single Color and Multi-Color Mix (Gradients).
 */
export const brandingThemeToCssVars = (theme: BrandingTheme): CSSProperties => {
  const vars: Record<string, string> = {};

  const preset = theme.preset ? BRAND_PRESETS[theme.preset.toLowerCase()] : undefined;
  const primary = theme.primaryColor || preset?.primaryColor || "#1d4ed8";
  const primaryHover = theme.primaryHoverColor || preset?.primaryHoverColor || primary;
  const secondary = theme.secondaryColor || preset?.secondaryColor;
  const accent = theme.accentColor || preset?.accentColor || secondary || "#3b82f6";
  const angle = theme.gradientAngle || "135deg";

  const isGradientMode =
    theme.colorMode === "gradient" ||
    theme.colorMode === "multi" ||
    preset?.mode === "gradient" ||
    Boolean(theme.gradient) ||
    Boolean(secondary);

  // Gradient computation
  const gradient =
    theme.gradient ||
    preset?.gradient ||
    (secondary ? `linear-gradient(${angle}, ${primary} 0%, ${secondary} 100%)` : `linear-gradient(${angle}, ${primary} 0%, ${accent} 100%)`);

  // Soft accent tint (12% opacity)
  const softAccent =
    theme.accentSoftColor ||
    preset?.accentSoftColor ||
    `${primary}1f`;

  // Glow shadow
  const glow = theme.glowColor || `${primary}40`;

  // Set brand tokens
  vars["--uab-brand-primary"] = primary;
  vars["--uab-brand-primary-hover"] = primaryHover;
  if (secondary) vars["--uab-brand-secondary"] = secondary;
  vars["--uab-brand-accent"] = accent;
  vars["--uab-brand-accent-soft"] = softAccent;
  vars["--uab-brand-gradient"] = gradient;
  vars["--uab-brand-glow"] = glow;
  vars["--uab-brand-border"] = `${primary}33`;

  // Dynamic Background: Gradient for multi-color mode, Solid for single-color mode
  vars["--uab-brand-bg"] = isGradientMode ? gradient : primary;
  vars["--uab-brand-bg-hover"] = isGradientMode ? gradient : primaryHover;
  vars["--uab-brand-text"] = "#ffffff";

  // Backward compatibility
  vars["--uab-primary"] = primary;
  vars["--uab-primary-hover"] = primaryHover;
  vars["--uab-accent"] = accent;
  vars["--uab-accent-soft"] = softAccent;
  vars["--erp-primary"] = primary;
  vars["--erp-primary-hover"] = primaryHover;
  vars["--erp-accent"] = accent;
  vars["--erp-accent-soft"] = softAccent;

  if (theme.surfaceColor) {
    vars["--erp-surface"] = theme.surfaceColor;
    vars["--uab-surface"] = theme.surfaceColor;
  }
  if (theme.surfaceMutedColor) {
    vars["--erp-surface-muted"] = theme.surfaceMutedColor;
    vars["--uab-surface-muted"] = theme.surfaceMutedColor;
  }
  if (theme.canvasColor) {
    vars["--erp-canvas"] = theme.canvasColor;
    vars["--uab-canvas"] = theme.canvasColor;
  }
  if (theme.foregroundColor) vars["--foreground"] = theme.foregroundColor;
  if (theme.textColor) {
    vars["--erp-ink"] = theme.textColor;
    vars["--uab-ink"] = theme.textColor;
  }
  if (theme.backgroundColor) vars["--background"] = theme.backgroundColor;
  if (theme.legalTextColor) vars["--legal-text-color"] = theme.legalTextColor;

  return vars as CSSProperties;
};
