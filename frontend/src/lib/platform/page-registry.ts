import type { SubModuleLink } from "@/app/(protected)/module-navigation";
import {
  FALLBACK_MODULE_META,
  FALLBACK_PAGE_DEFINITIONS,
  type ModuleKey,
} from "@/config/fallback-module-registry";

export const MODULE_MAPPING_STORAGE_KEY = "erp.platform.module-page-mapping.v1";
export const MODULE_MAPPING_UPDATED_EVENT = "erp:module-mapping-updated";

export type ModuleMeta = {
  key: ModuleKey;
  label: string;
  icon: string;
  description: string;
  homeHref: string;
};

export type ModuleMappingOverrides = Record<string, ModuleKey[]>;

export type PageRegistryItem = {
  id: string;
  key: string;
  name: string;
  path: string;
  icon?: string;
  group?: string;
  sortOrder: number;
  modules: ModuleKey[];
  permissionKeys: string[];
};

export const MODULE_META: ModuleMeta[] = FALLBACK_MODULE_META.map((module) => ({
  key: module.key,
  label: module.label,
  icon: module.icon,
  description: module.description,
  homeHref: module.homeHref,
}));

const MODULE_ORDER = new Map(MODULE_META.map((module, index) => [module.key, index]));
const VALID_MODULES = new Set(MODULE_META.map((module) => module.key));

const sortModuleKeys = (modules: ModuleKey[]) =>
  [...modules].sort((left, right) => (MODULE_ORDER.get(left) ?? 999) - (MODULE_ORDER.get(right) ?? 999));

const getEmptyModuleMap = (): Record<ModuleKey, SubModuleLink[]> =>
  Object.fromEntries(MODULE_META.map((module) => [module.key, [] as SubModuleLink[]])) as Record<ModuleKey, SubModuleLink[]>;

export function getDefaultPageRegistry(): PageRegistryItem[] {
  const pages = new Map<string, PageRegistryItem>();

  FALLBACK_PAGE_DEFINITIONS.forEach((page, index) => {
    const existing = pages.get(page.path);

    if (existing) {
      if (!existing.modules.includes(page.moduleKey)) {
        existing.modules = sortModuleKeys([...existing.modules, page.moduleKey]);
      }
      if ((!existing.group || existing.group === "Pages") && page.group) {
        existing.group = page.group;
      }
      if (!existing.icon && page.icon) {
        existing.icon = page.icon;
      }
      if (page.permissions.length > existing.permissionKeys.length) {
        existing.permissionKeys = page.permissions;
      }
      existing.sortOrder = Math.min(existing.sortOrder, index);
      return;
    }

    pages.set(page.path, {
      id: page.path,
      key: page.key,
      name: page.name,
      path: page.path,
      icon: page.icon,
      group: page.group,
      sortOrder: index,
      modules: [page.moduleKey],
      permissionKeys: page.permissions,
    });
  });

  return [...pages.values()].sort((left, right) =>
    left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)
  );
}

export function normalizeModuleMappingOverrides(input: ModuleMappingOverrides): ModuleMappingOverrides {
  const normalized: ModuleMappingOverrides = {};

  Object.entries(input || {}).forEach(([path, modules]) => {
    if (!path || !Array.isArray(modules)) return;

    const filtered = sortModuleKeys(
      modules.filter((moduleKey): moduleKey is ModuleKey => VALID_MODULES.has(moduleKey))
    );

    normalized[path] = [...new Set(filtered)];
  });

  return normalized;
}

export function resolvePageRegistry(overrides: ModuleMappingOverrides = {}): PageRegistryItem[] {
  const normalizedOverrides = normalizeModuleMappingOverrides(overrides);

  return getDefaultPageRegistry().map((page) => ({
    ...page,
    modules: normalizedOverrides[page.path] ?? page.modules,
  }));
}

export function resolveModuleNavigationMap(overrides: ModuleMappingOverrides = {}): Record<ModuleKey, SubModuleLink[]> {
  const moduleMap = getEmptyModuleMap();

  resolvePageRegistry(overrides).forEach((page) => {
        page.modules.forEach((moduleKey) => {
          moduleMap[moduleKey].push({
            key: page.key,
            name: page.name,
            path: page.path,
            icon: page.icon,
            group: page.group,
            order: page.sortOrder,
          });
        });
  });

  (Object.keys(moduleMap) as ModuleKey[]).forEach((moduleKey) => {
    moduleMap[moduleKey] = moduleMap[moduleKey].sort((left, right) => {
      const explicit = (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER);
      if (explicit !== 0) return explicit;

      const leftGroup = left.group ?? "Pages";
      const rightGroup = right.group ?? "Pages";
      return leftGroup === rightGroup
        ? left.name.localeCompare(right.name)
        : leftGroup.localeCompare(rightGroup);
    });
  });

  return moduleMap;
}

export function readModuleMappingOverrides(): ModuleMappingOverrides {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(MODULE_MAPPING_STORAGE_KEY);
    if (!raw) return {};
    return normalizeModuleMappingOverrides(JSON.parse(raw) as ModuleMappingOverrides);
  } catch {
    return {};
  }
}

export function persistModuleMappingOverrides(overrides: ModuleMappingOverrides) {
  if (typeof window === "undefined") return;

  const normalized = normalizeModuleMappingOverrides(overrides);
  window.localStorage.setItem(MODULE_MAPPING_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event(MODULE_MAPPING_UPDATED_EVENT));
}

export function clearModuleMappingOverrides() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(MODULE_MAPPING_STORAGE_KEY);
  window.dispatchEvent(new Event(MODULE_MAPPING_UPDATED_EVENT));
}

export function buildNavigationOverridePayload(pages: PageRegistryItem[]) {
  return {
    navigation: {
      modules: MODULE_META.map((module) => {
        const grouped = new Map<string, Array<{
          key: string;
          name: string;
          path: string;
          icon?: string;
          requiredPermissions: string[];
        }>>();

        pages
          .filter((page) => page.modules.includes(module.key))
          .forEach((page) => {
            const groupLabel = page.group?.trim() || "Pages";
            const items = grouped.get(groupLabel) ?? [];
            items.push({
              key: page.key,
              name: page.name,
              path: page.path,
              icon: page.icon,
              requiredPermissions: page.permissionKeys,
            });
            grouped.set(groupLabel, items);
          });

        return {
          key: module.key,
          groups: [...grouped.entries()].map(([label, items], groupIndex) => ({
            label,
            sortOrder: groupIndex,
            items: items.map((item, itemIndex) => ({
              ...item,
              sortOrder: itemIndex,
            })),
          })),
        };
      }),
    },
  };
}
