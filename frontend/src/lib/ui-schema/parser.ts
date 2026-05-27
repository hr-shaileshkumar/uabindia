import type {
  DashboardSchemaDto,
  NavigationSchemaDto,
  NavGroupDto,
  NavItemDto,
  NavModuleDto,
  PageSchemaDto,
  RoutePermissionRuleDto,
  RouteRulesDto,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function parseNavItem(input: unknown, index: number): NavItemDto | null {
  if (!isRecord(input)) return null;
  const path = asString(input.path);
  if (!path) return null;

  return {
    key: asString(input.key, `item-${index}`),
    name: asString(input.name, path),
    path,
    icon: typeof input.icon === "string" ? input.icon : null,
    sortOrder: asNumber(input.sortOrder, index),
    requiredPermissions: asStringArray(input.requiredPermissions),
  };
}

function parseNavGroup(input: unknown, index: number): NavGroupDto | null {
  if (!isRecord(input)) return null;
  const rawItems = Array.isArray(input.items) ? input.items : [];
  const items = rawItems.map(parseNavItem).filter((item): item is NavItemDto => !!item);

  return {
    label: asString(input.label, "Workspace"),
    sortOrder: asNumber(input.sortOrder, index),
    items,
  };
}

function parseNavModule(input: unknown, index: number): NavModuleDto | null {
  if (!isRecord(input)) return null;
  const key = asString(input.key);
  if (!key) return null;

  const rawGroups = Array.isArray(input.groups) ? input.groups : [];
  const groups = rawGroups.map(parseNavGroup).filter((group): group is NavGroupDto => !!group);

  return {
    key,
    displayName: asString(input.displayName, key),
    icon: typeof input.icon === "string" ? input.icon : null,
    homeHref: typeof input.homeHref === "string" ? input.homeHref : null,
    sortOrder: asNumber(input.sortOrder, index),
    groups,
  };
}

export function parseNavigationSchema(input: unknown): NavigationSchemaDto {
  if (!isRecord(input)) {
    return { schemaVersion: "fallback", modules: [] };
  }

  const rawModules = Array.isArray(input.modules) ? input.modules : [];
  const modules = rawModules
    .map(parseNavModule)
    .filter((module): module is NavModuleDto => !!module)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key));

  return {
    schemaVersion: asString(input.schemaVersion, "1"),
    modules,
  };
}

function parseRouteRule(input: unknown): RoutePermissionRuleDto | null {
  if (!isRecord(input)) return null;
  const pathPattern = asString(input.pathPattern);
  const moduleKey = asString(input.moduleKey);
  if (!pathPattern || !moduleKey) return null;

  return {
    pathPattern,
    moduleKey,
    permissionKeys: asStringArray(input.permissionKeys),
  };
}

export function parseRouteRules(input: unknown): RouteRulesDto {
  if (!isRecord(input)) {
    return { schemaVersion: "fallback", rules: [] };
  }

  const rawRules = Array.isArray(input.rules) ? input.rules : [];
  const rules = rawRules
    .map(parseRouteRule)
    .filter((rule): rule is RoutePermissionRuleDto => !!rule);

  return {
    schemaVersion: asString(input.schemaVersion, "1"),
    rules,
  };
}

export function parseDashboardSchema(input: unknown): DashboardSchemaDto {
  if (!isRecord(input)) {
    return { schemaVersion: "fallback", sections: [] };
  }

  const sections = Array.isArray(input.sections) ? input.sections : [];
  return {
    schemaVersion: asString(input.schemaVersion, "1"),
    sections: sections.filter(isRecord).map((section, index) => ({
      key: asString(section.key, `section-${index}`),
      title: asString(section.title, "Dashboard"),
      sortOrder: asNumber(section.sortOrder, index),
      widgets: Array.isArray(section.widgets)
        ? section.widgets.filter(isRecord).map((widget, widgetIndex) => ({
            key: asString(widget.key, `widget-${widgetIndex}`),
            type: ["card", "stat", "chart", "list", "custom"].includes(asString(widget.type))
              ? (asString(widget.type) as "card" | "stat" | "chart" | "list" | "custom")
              : "card",
            title: asString(widget.title, "Widget"),
            icon: typeof widget.icon === "string" ? widget.icon : null,
            href: typeof widget.href === "string" ? widget.href : null,
            dataEndpoint: typeof widget.dataEndpoint === "string" ? widget.dataEndpoint : null,
            moduleKey: typeof widget.moduleKey === "string" ? widget.moduleKey : null,
            sortOrder: asNumber(widget.sortOrder, widgetIndex),
            requiredPermissions: asStringArray(widget.requiredPermissions),
            props: isRecord(widget.props)
              ? Object.fromEntries(Object.entries(widget.props).filter(([, value]) => typeof value === "string") as [string, string][])
              : {},
          }))
        : [],
    })),
  };
}

export function parsePageSchema(input: unknown): PageSchemaDto | null {
  if (!isRecord(input)) return null;
  const pageKey = asString(input.pageKey);
  if (!pageKey) return null;

  const table = isRecord(input.table) ? (input.table as unknown as PageSchemaDto["table"]) : null;
  const form = isRecord(input.form) ? (input.form as unknown as PageSchemaDto["form"]) : null;
  const tabs = Array.isArray(input.tabs) ? (input.tabs.filter(isRecord) as unknown as PageSchemaDto["tabs"]) : [];
  const actions = Array.isArray(input.actions) ? (input.actions.filter(isRecord) as unknown as PageSchemaDto["actions"]) : [];

  return {
    schemaVersion: asString(input.schemaVersion, "1"),
    pageKey,
    title: asString(input.title, pageKey),
    subTitle: typeof input.subTitle === "string" ? input.subTitle : null,
    layout: ["crud", "tabs", "custom"].includes(asString(input.layout))
      ? (asString(input.layout) as "crud" | "tabs" | "custom")
      : "crud",
    handlerKey: typeof input.handlerKey === "string" ? input.handlerKey : null,
    table,
    form,
    tabs,
    actions,
  };
}
