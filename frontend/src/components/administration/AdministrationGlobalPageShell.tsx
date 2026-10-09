"use client";

/**
 * Administration Global Page Shell.
 * Re-exports canonical components/uab/UabPageShell with enterprise Administration naming.
 */

export {
  UabPageShell as AdministrationGlobalPageShell,
  UabPageShell as PlatformGlobalPageShell,
  UabPageShell,
  ErpPageShell,
  type KpiMetricItem,
  type FilterOption,
  type PlatformListColumn as AdministrationListColumn,
  type PlatformListColumn,
  type PlatformListColumn as ErpListColumnDef,
  type UabPageShellProps as AdministrationGlobalPageShellProps,
  type UabPageShellProps as PlatformGlobalPageShellProps,
  type UabPageShellProps,
  type ErpPageShellProps,
} from "@/components/uab/UabPageShell";
