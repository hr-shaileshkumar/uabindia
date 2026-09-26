import { describe, it, expect } from "vitest";
import {
  isBareLocalhost,
  isLocalhostHostname,
  getTenantSubdomainFromHost,
  hasTenantScopedHost,
} from "@/lib/tenant-host";
import {
  hasPublicTenantContextForRequest,
  resolvePublicAudience,
  resolvePublicAudienceFromRequest,
} from "@/lib/public-audience";

describe("tenant-host subdomain resolution", () => {
  it("identifies bare localhost accurately", () => {
    expect(isBareLocalhost("localhost")).toBe(true);
    expect(isBareLocalhost("127.0.0.1")).toBe(true);
    expect(isBareLocalhost("::1")).toBe(true);
    expect(isBareLocalhost("0.0.0.0")).toBe(true);
    expect(isBareLocalhost("uab.localhost")).toBe(false);
    expect(isBareLocalhost("uab.localhost:3000")).toBe(false);
  });

  it("identifies localhost variants including *.localhost", () => {
    expect(isLocalhostHostname("localhost")).toBe(true);
    expect(isLocalhostHostname("127.0.0.1")).toBe(true);
    expect(isLocalhostHostname("uab.localhost")).toBe(true);
    expect(isLocalhostHostname("uab.localhost:3000")).toBe(true);
    expect(isLocalhostHostname("uabindia.in")).toBe(false);
  });

  it("extracts subdomain from *.localhost correctly", () => {
    expect(getTenantSubdomainFromHost("uab.localhost")).toBe("uab");
    expect(getTenantSubdomainFromHost("uab.localhost:3000")).toBe("uab");
    expect(getTenantSubdomainFromHost("tenant1.localhost:3000")).toBe("tenant1");
    expect(getTenantSubdomainFromHost("localhost")).toBeNull();
    expect(getTenantSubdomainFromHost("localhost:3000")).toBeNull();
    expect(getTenantSubdomainFromHost("app.localhost:3000")).toBeNull(); // reserved
    expect(getTenantSubdomainFromHost("www.localhost:3000")).toBeNull(); // reserved
  });

  it("extracts subdomain from production multi-tenant domains", () => {
    expect(getTenantSubdomainFromHost("acme.uabindia.in")).toBe("acme");
    expect(getTenantSubdomainFromHost("uab.uabindia.in")).toBe("uab");
    expect(getTenantSubdomainFromHost("www.uabindia.in")).toBeNull(); // reserved
    expect(getTenantSubdomainFromHost("app.uabindia.in")).toBeNull(); // reserved
  });

  it("evaluates hasTenantScopedHost correctly", () => {
    expect(hasTenantScopedHost("uab.localhost")).toBe(true);
    expect(hasTenantScopedHost("uab.localhost:3000")).toBe(true);
    expect(hasTenantScopedHost("localhost")).toBe(false);
    expect(hasTenantScopedHost("localhost:3000")).toBe(false);
    expect(hasTenantScopedHost("127.0.0.1")).toBe(false);
    expect(hasTenantScopedHost("acme.uabindia.in")).toBe(true);
  });
});

describe("public-audience on subdomain hosts", () => {
  it("enforces tenant audience on tenant scoped hosts even if audience=platform is passed", () => {
    const audience = resolvePublicAudienceFromRequest({
      pathname: "/login",
      host: "uab.localhost:3000",
      requestedAudience: "platform",
    });
    expect(audience).toBe("tenant");

    const hasTenantCtx = hasPublicTenantContextForRequest({
      pathname: "/login",
      host: "uab.localhost:3000",
      requestedAudience: "platform",
    });
    expect(hasTenantCtx).toBe(true);
  });

  it("resolves platform audience when on root domain", () => {
    const audience = resolvePublicAudienceFromRequest({
      pathname: "/login",
      host: "localhost:3000",
      requestedAudience: "platform",
    });
    expect(audience).toBe("platform");
  });

  it("enforces tenant audience when hasTenantContext is true", () => {
    expect(resolvePublicAudience("platform", true)).toBe("tenant");
    expect(resolvePublicAudience(null, true)).toBe("tenant");
    expect(resolvePublicAudience("platform", false)).toBe("platform");
  });
});
