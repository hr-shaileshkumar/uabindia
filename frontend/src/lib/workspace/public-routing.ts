/** No public routes are platform-exclusive anymore. Audience-specific content now shares the same core pages. */
export const PLATFORM_ONLY_PATHS: readonly string[] = [];

export const TENANT_PUBLIC_HOME = "/";

export function isPlatformOnlyPath(pathname: string): boolean {
  return PLATFORM_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
