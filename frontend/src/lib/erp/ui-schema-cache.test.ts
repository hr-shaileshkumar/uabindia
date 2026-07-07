import { describe, expect, it } from "vitest";
import { UI_SCHEMA_CACHE_PREFIX, resolveUiSchemaCacheKey } from "@/lib/erp/ui-schema-cache";

describe("resolveUiSchemaCacheKey", () => {
  it("builds deterministic scoped key from user and org identity", () => {
    const key = resolveUiSchemaCacheKey({
      userId: "u-1",
      tenantId: "t-1",
      companyId: "c-1",
      role: "super_admin",
    });

    expect(key).toBe(`${UI_SCHEMA_CACHE_PREFIX}:u-1:t-1:c-1:super_admin`);
  });

  it("falls back to anonymous-safe defaults when identity is missing", () => {
    const key = resolveUiSchemaCacheKey(null);
    expect(key).toBe(`${UI_SCHEMA_CACHE_PREFIX}:anonymous:none:none:unknown`);
  });

  it("creates different keys for different tenants or users", () => {
    const keyA = resolveUiSchemaCacheKey({ userId: "u-1", tenantId: "t-1", companyId: "c-1", role: "admin" });
    const keyB = resolveUiSchemaCacheKey({ userId: "u-1", tenantId: "t-2", companyId: "c-1", role: "admin" });
    const keyC = resolveUiSchemaCacheKey({ userId: "u-2", tenantId: "t-1", companyId: "c-1", role: "admin" });

    expect(keyA).not.toBe(keyB);
    expect(keyA).not.toBe(keyC);
  });
});
