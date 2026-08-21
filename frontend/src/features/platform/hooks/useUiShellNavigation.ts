import { useQuery } from "@tanstack/react-query";
import { appApi } from "@/services/modules/app";

export const uiNavigationQueryKey = ["platform", "ui-shell", "navigation"] as const;

type NavigationItem = {
  label?: string;
  href?: string;
  path?: string;
  icon?: string;
};

type NavigationGroup = {
  label?: string;
  items?: NavigationItem[];
};

type NavigationModule = {
  key?: string;
  label?: string;
  displayName?: string;
  groups?: NavigationGroup[];
  items?: NavigationItem[];
};

export const useUiShellNavigation = () =>
  useQuery({
    queryKey: uiNavigationQueryKey,
    queryFn: async () => {
      const { data } = await appApi.uiShell.getNavigation();
      return data as { modules?: NavigationModule[] };
    },
    staleTime: 60_000,
  });

export const flattenNavigationItems = (payload?: { modules?: NavigationModule[] }) => {
  const rows: {
    id: string;
    label: string;
    href: string;
    moduleKey: string;
    groupLabel: string;
  }[] = [];

  for (const module of payload?.modules ?? []) {
    const moduleKey = module.key ?? "unknown";
    const moduleLabel = module.displayName ?? module.label ?? moduleKey;

    if (module.groups?.length) {
      for (const group of module.groups) {
        for (const item of group.items ?? []) {
          rows.push({
            id: `${moduleKey}-${item.href ?? item.path ?? item.label}`,
            label: item.label ?? "Menu Item",
            href: item.href ?? item.path ?? "/",
            moduleKey,
            groupLabel: group.label ?? moduleLabel,
          });
        }
      }
    }

    for (const item of module.items ?? []) {
      rows.push({
        id: `${moduleKey}-${item.href ?? item.path ?? item.label}`,
        label: item.label ?? "Menu Item",
        href: item.href ?? item.path ?? "/",
        moduleKey,
        groupLabel: moduleLabel,
      });
    }
  }

  return rows;
};
