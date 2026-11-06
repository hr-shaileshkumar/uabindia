export type BrandingTheme = {
  primaryColor?: string;
  primaryHoverColor?: string;
  accentColor?: string;
  accentSoftColor?: string;
  surfaceColor?: string;
  surfaceMutedColor?: string;
  canvasColor?: string;
  foregroundColor?: string;
  textColor?: string;
  backgroundColor?: string;
  legalTextColor?: string;
};

import type { CSSProperties } from "react";

export const parseBrandingTheme = (payload?: string | null): BrandingTheme => {
  if (!payload) return {};
  try {
    const parsed = JSON.parse(payload) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const theme = parsed as BrandingTheme;
    return {
      primaryColor: theme.primaryColor,
      primaryHoverColor: theme.primaryHoverColor,
      accentColor: theme.accentColor,
      accentSoftColor: theme.accentSoftColor,
      surfaceColor: theme.surfaceColor,
      surfaceMutedColor: theme.surfaceMutedColor,
      canvasColor: theme.canvasColor,
      foregroundColor: theme.foregroundColor,
      textColor: theme.textColor,
      backgroundColor: theme.backgroundColor,
      legalTextColor: theme.legalTextColor,
    };
  } catch {
    return {};
  }
};

export const brandingThemeToCssVars = (theme: BrandingTheme): CSSProperties => {
  const vars: Record<string, string> = {};
  if (theme.primaryColor) {
    vars["--erp-primary"] = theme.primaryColor;
    vars["--uab-primary"] = theme.primaryColor;
  }
  if (theme.primaryHoverColor) {
    vars["--erp-primary-hover"] = theme.primaryHoverColor;
    vars["--uab-primary-hover"] = theme.primaryHoverColor;
  }
  if (theme.accentColor) {
    vars["--erp-accent"] = theme.accentColor;
    vars["--uab-accent"] = theme.accentColor;
  }
  if (theme.accentSoftColor) {
    vars["--erp-accent-soft"] = theme.accentSoftColor;
    vars["--uab-accent-soft"] = theme.accentSoftColor;
  }
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
