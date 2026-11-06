import { describe, expect, it } from "vitest";
import { inferModuleScope, isWildcardPermission } from "./PermissionContext";

describe("PermissionContext helper functions", () => {
  it("infers module scope from module permission key", () => {
    expect(inferModuleScope("module:hrms.view")).toBe("hrms");
  });

  it("infers module scope from resource permission key", () => {
    expect(inferModuleScope("resource:finance.reports.view")).toBe("finance");
  });

  it("infers module scope from page permission key", () => {
    expect(inferModuleScope("page:hrms.employees")).toBe("hrms");
  });

  it("recognizes wildcard permission keys", () => {
    expect(isWildcardPermission("*")).toBe(true);
    expect(isWildcardPermission("module:*")).toBe(true);
    expect(isWildcardPermission("resource:*")).toBe(true);
    expect(isWildcardPermission("module:hrms.view")).toBe(false);
  });
});
