"use client";

/**
 * Administration Global Page Shell.
 * Re-exports canonical components/erp/ErpPageShell with enterprise Administration naming.
 */

export {
  ErpPageShell as AdministrationGlobalPageShell,
  ErpPageShell as PlatformGlobalPageShell,
  ErpPageShell,
  type KpiMetricItem,
  type FilterOption,
  type PlatformListColumn as AdministrationListColumn,
  type PlatformListColumn,
  type PlatformListColumn as ErpListColumnDef,
  type ErpPageShellProps as AdministrationGlobalPageShellProps,
  type ErpPageShellProps as PlatformGlobalPageShellProps,
  type ErpPageShellProps,
} from "@/components/erp/ErpPageShell";
