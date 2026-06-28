import type { Module } from "@/types";
import type { NavGroupDto, NavItemDto, NavModuleDto } from "@/lib/ui-schema/types";

export type WorkspaceNavItem = NavItemDto;

export type WorkspaceNavGroup = {
  label: string;
  sortOrder: number;
  items: WorkspaceNavItem[];
};

export type WorkspaceModule = {
  key: string;
  label: string;
  description?: string;
  icon?: string | null;
  homeHref: string | null;
  sortOrder: number;
  enabled: boolean;
  groups: WorkspaceNavGroup[];
  pageCount: number;
};

const MODULE_SUMMARIES: Record<string, string> = {
  platform: "Govern tenant operations, access policy, website settings, and platform controls from one operator workspace.",
  hrms: "Run employee operations, attendance, leave, recruitment, and people lifecycle workflows from one module home.",
  payroll: "Manage payroll processing, statutory setup, reimbursements, and employee payout workflows from one module home.",
  reports: "Track HR, payroll, compliance, ERP, and finance reporting flows with one reports control surface.",
  helpdesk: "Keep support intake, escalations, and knowledge content aligned in one service workspace.",
  communication: "Coordinate announcements and reusable message templates without leaving the workspace shell.",
  integrations: "Manage API keys, webhooks, connected apps, and diagnostics from one integration control area.",
  licensing: "Review subscription packaging, module access, and commercial controls from one licensing workspace.",
  security: "Monitor sessions, MFA, devices, access logs, and policy controls from one security workspace.",
};

const sortItems = (items: NavItemDto[]) =>
  items
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));

const sortGroups = (groups: NavGroupDto[]) =>
  groups
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder || left.label.localeCompare(right.label));

const normalizePath = (value?: string | null) => {
  if (!value || !value.startsWith("/")) return null;
  return value === "/" ? value : value.replace(/\/+$/, "");
};

const deriveRootPath = (value?: string | null) => {
  const normalized = normalizePath(value);
  if (!normalized) return null;

  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0) return "/";

  if (segments[0] === "platform") {
    return "/platform";
  }

  if (segments[0] === "erp") {
    if (segments.length === 1) return "/erp";
    return `/erp/${segments[1]}`;
  }

  return `/${segments[0]}`;
};

const pickPreferredRoot = (values: Array<string | null>) => {
  const roots = values.filter((value): value is string => Boolean(value));
  if (roots.length === 0) return null;

  const counts = new Map<string, number>();
  for (const root of roots) {
    counts.set(root, (counts.get(root) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) return right[1] - left[1];
      if (left[0].length !== right[0].length) return left[0].length - right[0].length;
      return left[0].localeCompare(right[0]);
    })[0]?.[0] ?? null;
};

export function resolveWorkspaceModuleHomeHref(module: NavModuleDto, moduleMeta?: Module) {
  const preferredRoot = pickPreferredRoot([
    deriveRootPath(moduleMeta?.basePath),
    ...module.groups.flatMap((group) => group.items.map((item) => deriveRootPath(item.path))),
  ]);

  if (preferredRoot) {
    return preferredRoot;
  }

  return normalizePath(module.homeHref) ?? normalizePath(moduleMeta?.basePath);
}

export function buildWorkspaceModules(navigationModules: NavModuleDto[], enabledModules: Module[] = []): WorkspaceModule[] {
  const moduleMetaByKey = new Map(enabledModules.map((module) => [module.key, module]));

  return navigationModules
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder || left.displayName.localeCompare(right.displayName))
    .map((module, moduleIndex) => {
      const groups = sortGroups(module.groups)
        .map((group, groupIndex) => ({
          label: group.label?.trim() || "Pages",
          sortOrder: typeof group.sortOrder === "number" ? group.sortOrder : groupIndex,
          items: sortItems(group.items),
        }))
        .filter((group) => group.items.length > 0);

      const moduleMeta = moduleMetaByKey.get(module.key);
      const pageCount = groups.reduce((count, group) => count + group.items.length, 0);

      return {
        key: module.key,
        label: module.displayName,
        description: moduleMeta?.description || MODULE_SUMMARIES[module.key],
        icon: module.icon || moduleMeta?.icon,
        homeHref: resolveWorkspaceModuleHomeHref(module, moduleMeta),
        sortOrder: typeof module.sortOrder === "number" ? module.sortOrder : moduleIndex,
        enabled: moduleMeta?.isEnabled !== false,
        groups,
        pageCount,
      };
    })
    .filter((module) => module.pageCount > 0);
}

export function filterWorkspaceModules(modules: WorkspaceModule[], query: string): WorkspaceModule[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return modules;

  return modules
    .map((module) => {
      const moduleMatches = `${module.label} ${module.key} ${module.description || ""}`.toLowerCase().includes(normalizedQuery);
      if (moduleMatches) {
        return module;
      }

      const groups = module.groups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            `${group.label} ${item.name} ${item.path} ${item.requiredPermissions.join(" ")}`.toLowerCase().includes(normalizedQuery)
          ),
        }))
        .filter((group) => group.items.length > 0);

      if (groups.length === 0) {
        return null;
      }

      return {
        ...module,
        groups,
        pageCount: groups.reduce((count, group) => count + group.items.length, 0),
      };
    })
    .filter((module): module is WorkspaceModule => Boolean(module));
}

export function findWorkspaceModuleByKey(modules: WorkspaceModule[], moduleKey: string) {
  return modules.find((module) => module.key === moduleKey) ?? null;
}

export function findWorkspaceModuleByPath(modules: WorkspaceModule[], pathname: string) {
  const normalizedPath = normalizePath(pathname);
  if (!normalizedPath) return null;

  return (
    modules.find((module) => {
      if (module.homeHref && (normalizedPath === module.homeHref || normalizedPath.startsWith(`${module.homeHref}/`))) {
        return true;
      }

      return module.groups.some((group) =>
        group.items.some((item) => normalizedPath === item.path || normalizedPath.startsWith(`${item.path}/`))
      );
    }) ?? null
  );
}
