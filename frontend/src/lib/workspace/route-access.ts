"use client";

import { canonicalizeProtectedPath } from "@/lib/workspace/route-config";
import type { RoutePermissionRuleDto } from "@/lib/ui-schema/types";

const toFeatureKey = (path: string) =>
  path
    .replace(/^\/+/, "")
    .replace(/\/+/g, ".")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();

export const getSchemaRouteRule = (
  path: string,
  rules: RoutePermissionRuleDto[] | undefined
) => {
  const canonicalPath = canonicalizeProtectedPath(path);
  const availableRules = Array.isArray(rules) ? rules : [];
  let bestMatch: RoutePermissionRuleDto | undefined;

  for (const rule of availableRules) {
    const rulePath = canonicalizeProtectedPath(rule.pathPattern);
    const exact = canonicalPath === rulePath;
    const nested = canonicalPath.startsWith(`${rulePath}/`);
    if (!exact && !nested) continue;

    if (!bestMatch || rulePath.length > canonicalizeProtectedPath(bestMatch.pathPattern).length) {
      bestMatch = rule;
    }
  }

  return bestMatch ?? null;
};

export const getSchemaRoutePermissionKeys = (
  path: string,
  rules: RoutePermissionRuleDto[] | undefined
) => {
  const rule = getSchemaRouteRule(path, rules);
  if (!rule) {
    return null;
  }

  const canonicalPath = canonicalizeProtectedPath(path);
  const normalizedPath = toFeatureKey(canonicalPath);

  return [...new Set([
    ...rule.permissionKeys,
    `page:${normalizedPath}`,
    `path:${normalizedPath}`,
    normalizedPath,
    `resource:${normalizedPath}.view`,
    `module:${rule.moduleKey}`,
    `${rule.moduleKey}.*`,
    `${rule.moduleKey}.view`,
    `resource:${rule.moduleKey}.view`,
  ])];
};

export const getEffectiveRoutePermissionKeys = (
  path: string,
  rules: RoutePermissionRuleDto[] | undefined
) => {
  return getSchemaRoutePermissionKeys(path, rules);
};
