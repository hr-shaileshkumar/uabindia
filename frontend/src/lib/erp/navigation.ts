import type { Module } from "@/types";
import { ROUTES } from "@/constants/routes";
import type { NavGroupDto, NavItemDto, NavModuleDto } from "@/lib/ui-schema/types";
import {
  getModuleDescription,
  getModuleIcon,
  getModuleLabel,
  getModuleShellOrder,
  listDerivedModules,
  listModuleRegistry,
  listSidebarVisibleModuleRegistry,
  type ModuleDefinition,
} from "@/lib/erp/module-registry";
import { canonicalizeProtectedPath } from "@/lib/erp/route-config";

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

export type WorkspacePageMatch = {
  module: WorkspaceModule;
  group: WorkspaceNavGroup;
  item: WorkspaceNavItem;
};

type LegacyModuleSegment = {
  key: string;
  label: string;
  description: string;
  icon: string;
  sortOrder: number;
  prefixes: string[];
};

const LEGACY_ERP_SEGMENTS: LegacyModuleSegment[] = listDerivedModules("erp").map((definition) => ({
  key: definition.key,
  label: definition.label,
  description: definition.description,
  icon: definition.icon,
  sortOrder: definition.shellOrder,
  prefixes: definition.pathPrefixes ?? [],
}));

/** Keys of modules hidden from sidebar top-level nav (but routes still work) */
const SIDEBAR_HIDDEN_MODULE_KEYS = new Set(
  listModuleRegistry()
    .filter((d) => d.hiddenFromSidebar)
    .map((d) => d.key)
);

/** Dead or duplicate chrome — routes may still exist, but they do not belong in the shell. */
const SIDEBAR_CHROME_EXCLUDED_KEYS = new Set([
  "healthcare",
  "fleet",
  "tours",
  "licensing",
  "operations",
]);

export type SidebarNavSection = {
  id: string;
  label: string;
  modules: WorkspaceModule[];
};

const SIDEBAR_SECTION_DEFS: Array<{ id: string; label: string; keys: readonly string[] }> = [
  { id: "work", label: "My work", keys: ["ess", "mss", "notifications", "workflow"] },
  { id: "people", label: "People", keys: ["hrms", "payroll"] },
  { id: "finance", label: "Finance", keys: ["finance", "reports"] },
  { id: "commerce", label: "Buy & sell", keys: ["procurement", "inventory", "crm", "sales"] },
  { id: "ops", label: "Operations", keys: ["projects", "assets", "helpdesk", "documents", "communication", "ai"] },
  { id: "platform", label: "Platform", keys: ["platform", "company", "superadmin", "security", "settings", "integrations"] },
];

export function groupWorkspaceModulesForSidebar(modules: WorkspaceModule[]): SidebarNavSection[] {
  const remaining = modules.filter((module) => !SIDEBAR_CHROME_EXCLUDED_KEYS.has(module.key));
  const used = new Set<string>();
  const sections: SidebarNavSection[] = [];

  for (const def of SIDEBAR_SECTION_DEFS) {
    const sectionModules = def.keys
      .map((key) => remaining.find((module) => module.key === key))
      .filter((module): module is WorkspaceModule => Boolean(module));

    for (const module of sectionModules) {
      used.add(module.key);
    }

    if (sectionModules.length > 0) {
      sections.push({ id: def.id, label: def.label, modules: sectionModules });
    }
  }

  const overflow = remaining.filter((module) => !used.has(module.key));
  if (overflow.length > 0) {
    sections.push({ id: "more", label: "More", modules: overflow });
  }

  return sections;
}


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

const normalizeComparablePath = (value?: string | null) => {
  const normalized = normalizePath(value);
  if (!normalized) return null;
  return canonicalizeProtectedPath(normalized);
};

const sortWorkspaceModules = (modules: WorkspaceModule[]) =>
  modules.slice().sort((left, right) => {
    const leftOrder = getModuleShellOrder(left.key, left.sortOrder ?? Number.MAX_SAFE_INTEGER);
    const rightOrder = getModuleShellOrder(right.key, right.sortOrder ?? Number.MAX_SAFE_INTEGER);
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
    return left.label.localeCompare(right.label);
  });

const FALLBACK_HOME_BY_MODULE: Record<string, string> = {
  platform: ROUTES.PLATFORM_HOME,
  superadmin: ROUTES.SUPERADMIN_DASHBOARD,
  company: ROUTES.PLATFORM_COMPANIES,
  administration: ROUTES.ADMINISTRATION_HOME,
  ess: ROUTES.ESS_HOME,
  mss: ROUTES.MSS_HOME,
  hrms: ROUTES.HRMS_HOME,
  payroll: ROUTES.PAYROLL_HOME,
  finance: ROUTES.FINANCE_HOME,
  inventory: ROUTES.INVENTORY_HOME,
  procurement: ROUTES.PROCUREMENT_HOME,
  crm: ROUTES.CRM_HOME,
  sales: ROUTES.SALES_HOME,
  projects: "/projects",
  assets: ROUTES.HR_ASSETS,
  reports: ROUTES.REPORTS_HOME,
  notifications: ROUTES.NOTIFICATIONS,
  workflow: ROUTES.APPROVALS,
  licensing: ROUTES.LICENSING_HOME,
  security: ROUTES.SECURITY_HOME,
  settings: ROUTES.PLATFORM_SETTINGS,
  helpdesk: ROUTES.HELPDESK_HOME,
  integrations: ROUTES.INTEGRATIONS_HOME,
  communication: ROUTES.COMMUNICATION_HOME,
  documents: ROUTES.DOCUMENTS,
};

function getFallbackHomeHref(moduleKey: string) {
  return FALLBACK_HOME_BY_MODULE[moduleKey] ?? ROUTES.CONTEXT;
}

function buildFallbackWorkspaceModule(definition: ModuleDefinition): WorkspaceModule {
  const homeHref = getFallbackHomeHref(definition.key);
  return {
    key: definition.key,
    label: definition.label,
    description: definition.description,
    icon: definition.icon,
    homeHref,
    sortOrder: definition.shellOrder,
    enabled: true,
    groups: [
      {
        label: "Pages",
        sortOrder: 0,
        items: [
          {
            key: `${definition.key}:overview`,
            name: `${definition.label} overview`,
            path: homeHref,
            icon: definition.icon,
            sortOrder: 0,
            requiredPermissions: [`module:${definition.key}`],
          },
        ],
      },
    ],
    pageCount: 1,
  };
}

export function buildFallbackWorkspaceModules(enabledModules: Module[] = []): WorkspaceModule[] {
  const enabledKeys = new Set(enabledModules.map((module) => module.key));
  // Use sidebar-visible registry so hidden modules (like administration) don't appear in sidebar
  const registryDefinitions = listSidebarVisibleModuleRegistry().filter((definition) => !definition.sourceModuleKey);

  const modules = registryDefinitions
    .filter((definition) => enabledKeys.size === 0 || enabledKeys.has(definition.key))
    .map((definition) => buildFallbackWorkspaceModule(definition));

  return sortWorkspaceModules(modules);
}

const deriveRootPath = (value?: string | null) => {
  const normalized = normalizePath(value);
  if (!normalized) return null;

  const canonical = canonicalizeProtectedPath(normalized);
  const segments = canonical.split("/").filter(Boolean);
  if (segments.length === 0) return "/";

  if (segments[0] === "platform") {
    return "/platform";
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
  const knownHome = FALLBACK_HOME_BY_MODULE[module.key];
  if (knownHome) {
    return knownHome;
  }

  const preferredRoot = pickPreferredRoot([
    deriveRootPath(moduleMeta?.basePath),
    ...module.groups.flatMap((group) => group.items.map((item) => deriveRootPath(item.path))),
  ]);

  if (preferredRoot) {
    return preferredRoot;
  }

  return normalizePath(module.homeHref) ?? normalizePath(moduleMeta?.basePath);
}

function materializeWorkspaceModule(
  moduleKey: string,
  displayName: string,
  icon: string | null | undefined,
  description: string | undefined,
  sortOrder: number,
  moduleMeta: Module | undefined,
  groups: WorkspaceNavGroup[],
  fallbackHomeHref?: string | null
): WorkspaceModule | null {
  const normalizedGroups = groups.filter((group) => group.items.length > 0);
  const pageCount = normalizedGroups.reduce((count, group) => count + group.items.length, 0);
  if (pageCount === 0) {
    return null;
  }

  const explicitFallbackHomeHref = normalizePath(fallbackHomeHref);
  const knownHome = normalizePath(FALLBACK_HOME_BY_MODULE[moduleKey]);
  const homeHref =
    knownHome ??
    explicitFallbackHomeHref ??
    pickPreferredRoot([
      deriveRootPath(moduleMeta?.basePath),
      ...normalizedGroups.flatMap((group) => group.items.map((item) => deriveRootPath(item.path))),
    ]);

  return {
    key: moduleKey,
    label: getModuleLabel(moduleKey, displayName),
    description: moduleMeta?.description || description || getModuleDescription(moduleKey),
    icon: getModuleIcon(moduleKey, icon || moduleMeta?.icon),
    homeHref,
    sortOrder,
    enabled: moduleMeta?.isEnabled !== false,
    groups: normalizedGroups,
    pageCount,
  };
}

function splitLegacyErpModule(module: NavModuleDto, moduleMeta?: Module): WorkspaceModule[] {
  const groupedItems = sortGroups(module.groups).map((group, groupIndex) => ({
    label: group.label?.trim() || "Pages",
    sortOrder: typeof group.sortOrder === "number" ? group.sortOrder : groupIndex,
    items: sortItems(group.items),
  }));

  const splitModules = LEGACY_ERP_SEGMENTS.map((segment) => {
    const segmentGroups = groupedItems
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const path = normalizeComparablePath(item.path);
          return Boolean(path && segment.prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)));
        }),
      }))
      .filter((group) => group.items.length > 0);

    return materializeWorkspaceModule(
      segment.key,
      segment.label,
      segment.icon,
      segment.description,
      segment.sortOrder,
      moduleMeta,
      segmentGroups,
      getFallbackHomeHref(segment.key)
    );
  }).filter((workspaceModule): workspaceModule is WorkspaceModule => Boolean(workspaceModule));

  const assignedPaths = new Set(
    splitModules.flatMap((workspaceModule) =>
      workspaceModule.groups.flatMap((group) => group.items.map((item) => normalizeComparablePath(item.path))).filter(Boolean) as string[]
    )
  );

  const overflowGroups = groupedItems
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const path = normalizeComparablePath(item.path);
        return Boolean(path && !assignedPaths.has(path));
      }),
    }))
    .filter((group) => group.items.length > 0);

  const overflowModule = materializeWorkspaceModule(
    "operations",
    "Operations",
    "grid",
    "Run shared operational workflows that do not belong to a single business domain.",
    170,
    moduleMeta,
    overflowGroups
  );

  return overflowModule ? [...splitModules, overflowModule] : splitModules;
}

export function buildWorkspaceModules(navigationModules: NavModuleDto[], enabledModules: Module[] = []): WorkspaceModule[] {
  const moduleMetaByKey = new Map(enabledModules.map((module) => [module.key, module]));

  const workspaceModules = navigationModules
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder || left.displayName.localeCompare(right.displayName))
    .flatMap((module, moduleIndex) => {
      const moduleMeta = moduleMetaByKey.get(module.key);

      if (module.key === "erp") {
        return splitLegacyErpModule(module, moduleMeta);
      }

      const groups = sortGroups(module.groups)
        .map((group, groupIndex) => ({
          label: group.label?.trim() || "Pages",
          sortOrder: typeof group.sortOrder === "number" ? group.sortOrder : groupIndex,
          items: sortItems(group.items),
        }))
        .filter((group) => group.items.length > 0);

      return materializeWorkspaceModule(
        module.key,
        module.displayName,
        module.icon || moduleMeta?.icon,
        getModuleDescription(module.key),
        typeof module.sortOrder === "number" ? module.sortOrder : moduleIndex,
        moduleMeta,
        groups,
        resolveWorkspaceModuleHomeHref(module, moduleMeta)
      );
    })
    .filter((module): module is WorkspaceModule => Boolean(module));

  return sortWorkspaceModules(workspaceModules)
    .filter((module) => module.pageCount > 0)
    .filter((module) => !SIDEBAR_HIDDEN_MODULE_KEYS.has(module.key));
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
  const normalizedPath = normalizeComparablePath(pathname);
  if (!normalizedPath) return null;

  return (
    modules.find((module) => {
      const comparableHomeHref = normalizeComparablePath(module.homeHref);
      if (comparableHomeHref && (normalizedPath === comparableHomeHref || normalizedPath.startsWith(`${comparableHomeHref}/`))) {
        return true;
      }

      return module.groups.some((group) =>
        group.items.some((item) => {
          const comparableItemPath = normalizeComparablePath(item.path);
          if (!comparableItemPath) {
            return false;
          }

          return normalizedPath === comparableItemPath || normalizedPath.startsWith(`${comparableItemPath}/`);
        })
      );
    }) ?? null
  );
}

export function flattenWorkspacePages(modules: WorkspaceModule[]): WorkspacePageMatch[] {
  return modules.flatMap((module) =>
    module.groups.flatMap((group) =>
      group.items.map((item) => ({
        module,
        group,
        item,
      }))
    )
  );
}

export function findWorkspacePageByPath(modules: WorkspaceModule[], pathname: string) {
  const normalizedPath = normalizeComparablePath(pathname);
  if (!normalizedPath) {
    return null;
  }

  let bestMatch: WorkspacePageMatch | null = null;
  let bestMatchPathLength = -1;

  for (const page of flattenWorkspacePages(modules)) {
    const comparableItemPath = normalizeComparablePath(page.item.path);
    if (!comparableItemPath) {
      continue;
    }

    if (normalizedPath !== comparableItemPath && !normalizedPath.startsWith(`${comparableItemPath}/`)) {
      continue;
    }

    if (comparableItemPath.length > bestMatchPathLength) {
      bestMatch = page;
      bestMatchPathLength = comparableItemPath.length;
    }
  }

  return bestMatch;
}
