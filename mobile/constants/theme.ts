// constants/theme.ts – Executive Luxury Design Tokens for Uabindia Enterprise HRMS
import { Platform } from "react-native";

export const COLORS = {
  // Core Corporate Palette
  primary: "#0F52BA",          // Sapphire Royal Blue
  primaryDark: "#070D18",      // Midnight Obsidian
  primaryLight: "#2563EB",     // Vivid Cobalt
  primaryMuted: "#EBF3FF",     // Soft Ice Blue tint
  accent: "#00B0FF",          // Electric Cyan
  accentGlow: "rgba(0,176,255,0.15)",

  // Legacy gradient start/end compat
  gradientStart: "#0F52BA",
  gradientEnd: "#070D18",

  // Luxury Accents
  emerald: "#10B981",          // Success & Present
  emeraldLight: "#ECFDF5",
  amber: "#F59E0B",            // Warning & Pending
  amberLight: "#FFFBEB",
  rose: "#EF4444",             // Error & Absent
  roseLight: "#FEF2F2",
  indigo: "#6366F1",           // Analytics & Reports
  indigoLight: "#EEF2FF",
  violet: "#8B5CF6",           // Holidays & Special
  violetLight: "#F5F3FF",
  teal: "#0D9488",             // Projects & Geo
  tealLight: "#F0FDFA",

  // Semantic Status Colors
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  leave: "#F97316",
  holiday: "#8B5CF6",
  weekend: "#64748B",

  // Base Neutrals
  white: "#FFFFFF",
  black: "#000000",
  background: "#F8FAFC",       // Clean executive slate background
  surface: "#FFFFFF",
  surfaceSubtle: "#F1F5F9",
  card: "#FFFFFF",
  cardHeader: "#F8FAFC",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  borderFocus: "#3B82F6",
  inputBg: "#F8FAFC",
  overlay: "rgba(7, 13, 24, 0.75)",

  // Typography Colors
  textPrimary: "#0F172A",      // Dark Slate 900
  textSecondary: "#475569",    // Slate 600
  textMuted: "#94A3B8",        // Slate 400
  textInverse: "#FFFFFF",

  // Luxury Gradients
  gradientMidnight: ["#070D18", "#0A192F", "#0F2E59"] as const,
  gradientSapphire: ["#0F52BA", "#1D4ED8", "#2563EB"] as const,
  gradientEmerald: ["#059669", "#10B981"] as const,
  gradientAmber: ["#D97706", "#F59E0B"] as const,
  gradientGlass: ["rgba(255,255,255,0.9)", "rgba(255,255,255,0.7)"] as const,
  gradientCardDark: ["#0D1C34", "#0A1628"] as const,
};

// Direct hex string mapping for standard RN component styles
export const STATUS_COLORS: Record<string, string> = {
  present:  "#10B981",
  absent:   "#EF4444",
  leave:    "#F97316",
  holiday:  "#8B5CF6",
  weekend:  "#64748B",
  half_day: "#2563EB",
  late:     "#F59E0B",
  unknown:  "#94A3B8",
};

// Rich triple token details for badges and pills
export const STATUS_DETAILS: Record<string, { bg: string; text: string; border: string }> = {
  present:  { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" },
  absent:   { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  leave:    { bg: "#FFF7ED", text: "#C2410C", border: "#FFEDD5" },
  holiday:  { bg: "#F5F3FF", text: "#7C3AED", border: "#DDD6FE" },
  weekend:  { bg: "#F1F5F9", text: "#475569", border: "#E2E8F0" },
  half_day: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  late:     { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
  unknown:  { bg: "#F8FAFC", text: "#64748B", border: "#E2E8F0" },
};

export const FONTS = {
  regular:  { fontFamily: Platform.OS === "ios" ? "System" : "sans-serif", fontWeight: "400" as const },
  medium:   { fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium", fontWeight: "500" as const },
  semiBold: { fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium", fontWeight: "600" as const },
  bold:     { fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-bold", fontWeight: "700" as const },
  heavy:    { fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-bold", fontWeight: "800" as const },
};

export const SPACING = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 36,
};

export const RADIUS = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 22, xxl: 28, full: 9999,
};

const isWeb = Platform.OS === "web";

export const SHADOW = {
  xs: isWeb
    ? { boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05)" } as any
    : { shadowColor: "#0F172A", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  sm: isWeb
    ? { boxShadow: "0 2px 4px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)" } as any
    : { shadowColor: "#0F172A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  md: isWeb
    ? { boxShadow: "0 4px 8px -2px rgba(15, 23, 42, 0.1), 0 2px 4px -2px rgba(15, 23, 42, 0.06)" } as any
    : { shadowColor: "#0F172A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  lg: isWeb
    ? { boxShadow: "0 10px 18px -3px rgba(15, 23, 42, 0.12), 0 4px 6px -4px rgba(15, 23, 42, 0.08)" } as any
    : { shadowColor: "#0F172A", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 16, elevation: 8 },
  glow: isWeb
    ? { boxShadow: "0 0 20px rgba(37, 99, 235, 0.3)" } as any
    : { shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
};